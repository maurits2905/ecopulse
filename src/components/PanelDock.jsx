import { useMemo, useState } from "react";

export default function PanelDock({ groups }) {
  const firstKey = groups[0]?.key ?? "";
  const [activeKey, setActiveKey] = useState(firstKey);

  const activeGroup = useMemo(
    () => groups.find((group) => group.key === activeKey) ?? groups[0],
    [groups, activeKey]
  );

  return (
    <aside className="panel-dock">
      <div className="dock-tabs-panel">
        <div className="dock-tab-row">
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              className={`dock-tab${group.key === activeKey ? " active" : ""}`}
              onClick={() => setActiveKey(group.key)}
            >
              {group.label}
              {group.badge ? <span className="dock-tab-badge">{group.badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="dock-panel-header">
          <div>
            <p className="eyebrow">{activeGroup?.title ?? "Panels"}</p>
            {activeGroup?.description ? (
              <p className="dock-description">{activeGroup.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="dock-panel-stack">
        {activeGroup?.items?.map((item, index) => (
          <div className="dock-panel-item" key={`${activeGroup.key}-${index}`}>
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}