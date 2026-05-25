import { useUIStore } from "@/stores/uiStore";
import { EXTENSION_TABS } from "@/lib/extensions-config";

export default function ExtensionsView() {
  const activeTab = useUIStore((s) => s.extensionsTab);
  const setExtensionsTab = useUIStore((s) => s.setExtensionsTab);

  return (
    <nav className="sidebar-extensions-nav" aria-label="Extensions">
      {EXTENSION_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setExtensionsTab(tab.id)}
            className={`sidebar-extensions-nav-item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="sidebar-extensions-nav-icon">{tab.icon}</span>
            <span className="sidebar-extensions-nav-copy">
              <span className="sidebar-extensions-nav-label">{tab.label}</span>
              <span className="sidebar-extensions-nav-desc">{tab.description}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
