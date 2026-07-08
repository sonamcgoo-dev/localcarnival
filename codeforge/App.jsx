import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ErrorBoundary, NotFoundPage } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { CreateToolPage } from './pages/CreateToolPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SearchPage } from './pages/SearchPage';
import { DocsPage } from './pages/DocsPage';
import { CataloguesPage } from './pages/CataloguesPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ApiIntegrationsPage } from './pages/ApiIntegrationsPage';
import { ServersPage } from './pages/ServersPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { EndpointsPage } from './pages/EndpointsPage';
import { ProfilePage } from './pages/ProfilePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Standalone pages (no shell) */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<OnboardingPage />} />
          <Route path="/create" element={<CreateToolPage />} />
          <Route path="/tool/:name" element={<ToolDetailPage />} />

          {/* Main app with sidebar shell */}
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/catalogues" element={<CataloguesPage />} />
            <Route path="/catalogue/:slug" element={<CataloguesPage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/dataset/:slug" element={<DatasetsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/template/:slug" element={<TemplatesPage />} />
            <Route path="/api-integrations" element={<ApiIntegrationsPage />} />
            <Route path="/api-integration/:slug" element={<ApiIntegrationsPage />} />
            <Route path="/servers" element={<ServersPage />} />
            <Route path="/server/:slug" element={<ServersPage />} />
            <Route path="/servers/create" element={<ServersPage />} />
            <Route path="/endpoints" element={<EndpointsPage />} />
            <Route path="/profiles" element={<ProfilePage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/*" element={<DocsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;