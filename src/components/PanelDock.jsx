import { useMemo, useState } from "react";

export default function PanelDock({ groups }) {
  const firstKey = groups[0]?.key ?? "";
  const [activeKey, setActiveKey] = useState(firstKey);

  const activeGroup = useMemo(
    () => groups.find((group) => group.key === activeKey) ?? groups[0],
    [groups, activeKey]
  );

  return (
    <aside className="side-column panel-dock">
      <div className="panel dock-tabs-panel">
        <div className="panel-heading dock-heading">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{activeGroup?.title ?? "Panels"}</h2>
          </div>

          <span className="dock-count">
            {activeGroup?.items?.length ?? 0} panels
          </span>
        </div>

        <div className="dock-tabs">
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              className={group.key === activeKey ? "active" : ""}
              onClick={() => setActiveKey(group.key)}
            >
              <span>{group.label}</span>
              {group.badge ? <strong>{group.badge}</strong> : null}
            </button>
          ))}
        </div>

        {activeGroup?.description ? (
          <p className="dock-description">{activeGroup.description}</p>
        ) : null}
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