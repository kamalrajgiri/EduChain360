import React, {
  useState
} from "react";

import PageHeader from "../../components/admin/PageHeader";

function Settings() {

  const [rbac, setRbac] =
    useState(true);

  const [audit, setAudit] =
    useState(true);

  const [blockchain, setBlockchain] =
    useState(true);

  return (
    <>

      <PageHeader
        eyebrow="SYSTEM SETTINGS"
        title="Administrator settings"
        description="Configure institution-wide security, access and system services."
      />

      <div className="settings-grid">

        <section className="card settings-card">

          <h3>
            Security & Access
          </h3>

          <Setting
            title="Role-based access"
            description="Control permissions according to portal roles."
            value={rbac}
            setValue={setRbac}
          />

          <Setting
            title="Audit logging"
            description="Record administrator and privileged activity."
            value={audit}
            setValue={setAudit}
          />

          <Setting
            title="Blockchain protection"
            description="Protect verified records from unauthorized changes."
            value={blockchain}
            setValue={setBlockchain}
          />

        </section>

        <section className="card settings-card">

          <h3>
            System configuration
          </h3>

          <div className="setting-value">
            <span>
              Frontend
            </span>

            <strong>
              React.js
            </strong>
          </div>

          <div className="setting-value">
            <span>
              Backend
            </span>

            <strong>
              Node.js
            </strong>
          </div>

          <div className="setting-value">
            <span>
              Database
            </span>

            <strong>
              MySQL
            </strong>
          </div>

          <div className="setting-value">
            <span>
              Verification
            </span>

            <strong>
              Blockchain Service
            </strong>
          </div>

        </section>

      </div>

    </>
  );
}

function Setting({
  title,
  description,
  value,
  setValue
}) {

  return (
    <div className="setting-row">

      <div>

        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>

      </div>

      <button
        className={`toggle ${
          value ? "on" : ""
        }`}
        onClick={() =>
          setValue(!value)
        }
      >
        <span />
      </button>

    </div>
  );
}

export default Settings;