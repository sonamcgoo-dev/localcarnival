/**
 * RecommendationsEngine
 * 
 * Provides artifact recommendations based on various signals.
 */

import { EventBus } from '@localcircus/core';
import { RegistryEntry, Recommendation } from '../types';

interface UsageStats {
  installed: string[];
  coOccurrences: Map<string, number>;
  ratings: Map<string, { sum: number; count: number }>;
}

export class RecommendationsEngine {
  private entries: Map<string, RegistryEntry> = new Map();
  private usageStats: UsageStats;
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
    this.usageStats = {
      installed: [],
      coOccurrences: new Map(),
      ratings: new Map(),
    };
  }

  /**
   * Add an entry to the recommendation engine
   */
  addEntry(entry: RegistryEntry): void {
    this.entries.set(entry.uuid, entry);
  }

  /**
   * Remove an entry
   */
  removeEntry(uuid: string): void {
    this.entries.delete(uuid);
  }

  /**
   * Record an installation
   */
  recordInstall(uuid: string): void {
    this.usageStats.installed.push(uuid);
    this.updateCoOccurrences(uuid);
  }

  /**
   * Record an uninstallation
   */
  recordUninstall(uuid: string): void {
    const index = this.usageStats.installed.indexOf(uuid);
    if (index !== -1) {
      this.usageStats.installed.splice(index, 1);
    }
  }

  /**
   * Record a rating
   */
  recordRating(uuid: string, rating: number): void {
    const current = this.usageStats.ratings.get(uuid) || { sum: 0, count: 0 };
    current.sum += rating;
    current.count += 1;
    this.usageStats.ratings.set(uuid, current);
  }

  /**
   * Update co-occurrence statistics
   */
  private updateCoOccurrences(newUuid: string): void {
    for (const existingUuid of this.usageStats.installed) {
      if (existingUuid === newUuid) continue;

      const key = this.getCoOccurrenceKey(existingUuid, newUuid);
      const count = this.usageStats.coOccurrences.get(key) || 0;
      this.usageStats.coOccurrences.set(key, count + 1);
    }
  }

  /**
   * Get co-occurrence key
   */
  private getCoOccurrenceKey(a: string, b: string): string {
    return [a, b].sort().join(':');
  }

  /**
   * Get recommendations for an artifact
   */
  getForArtifact(uuid: string, limit = 10): Recommendation[] {
    const entry = this.entries.get(uuid);
    if (!entry) return [];

    const recommendations: Recommendation[] = [];

    // 1. Similar artifacts (same category/type)
    const similar = this.findSimilar(entry, limit * 2);
    for (const [simEntry, score] of similar) {
      recommendations.push({
        artifact: simEntry,
        reason: `Similar to ${entry.displayName}`,
        score: score * 0.8,
        basedOn: uuid,
      });
    }

    // 2. Frequently installed together
    const coInstalled = this.findCoInstalled(uuid, limit);
    for (const [coEntry, count] of coInstalled) {
      recommendations.push({
        artifact: coEntry,
        reason: 'Frequently installed together',
        score: Math.min(count / 10, 1) * 0.9,
        basedOn: uuid,
      });
    }

    // 3. Dependencies of this artifact
    const dependencies = this.findDependencies(entry, limit);
    for (const depEntry of dependencies) {
      recommendations.push({
        artifact: depEntry,
        reason: 'Required by this artifact',
        score: 1.0,
        basedOn: uuid,
      });
    }

    // 4. Artifacts that depend on this
    const dependents = this.findDependents(entry, limit);
    for (const depEntry of dependents) {
      recommendations.push({
        artifact: depEntry,
        reason: 'Depends on this artifact',
        score: 0.9,
        basedOn: uuid,
      });
    }

    // Sort by score and deduplicate
    const unique = new Map<string, Recommendation>();
    for (const rec of recommendations) {
      const existing = unique.get(rec.artifact.uuid);
      if (!existing || existing.score < rec.score) {
        unique.set(rec.artifact.uuid, rec);
      }
    }

    return Array.from(unique.values())
      .filter(r => r.artifact.uuid !== uuid)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get general recommendations
   */
  getGeneral(limit = 10): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Trending
    const trending = this.getTrending(limit);
    for (const entry of trending) {
      recommendations.push({
        artifact: entry,
        reason: 'Trending now',
        score: 0.9,
      });
    }

    // Highly rated
    const highlyRated = this.getHighlyRated(limit);
    for (const entry of highlyRated) {
      recommendations.push({
        artifact: entry,
        reason: 'Highly rated',
        score: 0.8,
      });
    }

    // New
    const recent = this.getRecent(limit);
    for (const entry of recent) {
      recommendations.push({
        artifact: entry,
        reason: 'Recently added',
        score: 0.7,
      });
    }

    // Sort by score
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find similar artifacts
   */
  private findSimilar(
    entry: RegistryEntry,
    limit: number
  ): Array<[RegistryEntry, number]> {
    const results: Array<[RegistryEntry, number]> = [];

    for (const other of this.entries.values()) {
      if (other.uuid === entry.uuid) continue;

      let score = 0;

      // Same category
      if (other.category === entry.category) score += 0.3;

      // Same type
      if (other.type === entry.type) score += 0.2;

      // Overlapping tags
      const commonTags = entry.tags.filter(t => other.tags.includes(t));
      score += commonTags.length * 0.1;

      // Similar rating
      if (Math.abs(other.rating - entry.rating) < 0.5) score += 0.1;

      // Popular
      if (other.downloads > 1000) score += 0.1;

      if (score > 0) {
        results.push([other, score]);
      }
    }

    return results
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  /**
   * Find artifacts frequently installed together
   */
  private findCoInstalled(
    uuid: string,
    limit: number
  ): Array<[RegistryEntry, number]> {
    const results: Array<[RegistryEntry, number]> = [];

    for (const [key, count] of this.usageStats.coOccurrences) {
      if (!key.includes(uuid)) continue;

      const parts = key.split(':');
      const otherUuid = parts.find(p => p !== uuid);
      if (!otherUuid) continue;

      const entry = this.entries.get(otherUuid);
      if (entry) {
        results.push([entry, count]);
      }
    }

    return results
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  /**
   * Find dependencies (placeholder - would use graph data)
   */
  private findDependencies(
    entry: RegistryEntry,
    limit: number
  ): RegistryEntry[] {
    // In real implementation, this would use the graph database
    return [];
  }

  /**
   * Find dependents (placeholder - would use graph data)
   */
  private findDependents(
    entry: RegistryEntry,
    limit: number
  ): RegistryEntry[] {
    // In real implementation, this would use the graph database
    return [];
  }

  /**
   * Get trending artifacts
   */
  private getTrending(limit: number): RegistryEntry[] {
    const entries = Array.from(this.entries.values());
    
    // Simple trending: downloads + recent activity
    entries.sort((a, b) => {
      const aScore = a.downloads + (a.updatedAt / 100000);
      const bScore = b.downloads + (b.updatedAt / 100000);
      return bScore - aScore;
    });

    return entries.slice(0, limit);
  }

  /**
   * Get highly rated artifacts
   */
  private getHighlyRated(limit: number): RegistryEntry[] {
    const entries = Array.from(this.entries.values());
    
    entries.sort((a, b) => b.rating - a.rating);

    return entries.slice(0, limit);
  }

  /**
   * Get recent artifacts
   */
  private getRecent(limit: number): RegistryEntry[] {
    const entries = Array.from(this.entries.values());
    
    entries.sort((a, b) => b.publishedAt - a.publishedAt);

    return entries.slice(0, limit);
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default RecommendationsEngine;
