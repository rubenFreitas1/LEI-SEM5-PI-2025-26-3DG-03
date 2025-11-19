# US 3.5.6 — Risk Analysis


| ID | Risk Description | Category (Technical/Operational/Security/Other) | Likelihood (Low/Medium/High) | Impact (Low/Medium/High) | Mitigation Strategy | Residual Risk (Low/Medium/High) |
|----|------------------|-----------------------------------------------|------------------------------|---------------------------|----------------------|----------------------------------|
| 1 | Failure or misconfiguration of IAM integration may prevent users from authenticating. | Security/Operational | Medium | High |  Monitor IAM availability; test token validation thoroughly. | Low |
| 2 | RBAC rules incorrectly configured in SPA or backend may expose unauthorized features. | Security | Medium | High | Enforce RBAC on backend; add automated tests; conduct regular audits; log unauthorized attempts. | Low |
|3 | Mismatch between frontend auth integration (Keycloak) and backend auth setup could allow unauthorized access. | Security/Technical | Medium | High | Align auth configuration between UI (Keycloak) and API; verify token validation on server; add end-to-end auth tests. | Low |
| 4 | Improper handling or validation of authentication tokens leakage. | Security | Medium | High | Validate tokens on server, use secure storage for refresh tokens, rotate keys. | Low |
| 5| 3D module integration may degrade SPA performance or create UI instability. | Technical | Medium | Medium | Use lazy loading; test performance early; optimize models and textures. | Low |
| 6 | API downtime or network issues between backend modules may break scheduling or 3D data loading. | Operational | Medium | High | Add retries/timeouts; display user-friendly errors. | Medium |
| 6 | Incorrect scheduling algorithm implementation may generate invalid or infeasible schedules. | Technical | Medium | Medium | Validate input data; add unit/integration tests; implement fallback heuristic algorithm; document assumptions. | Low |
| 7 | Resource or staff data inconsistencies may lead to invalid planning results. | Technical/Operational | Low | Medium | Validate data on input; enforce constraints; expose warnings in UI; log anomalies. | Low |
| 8 | Failure in backup strategy or corrupted backups may lead to unrecoverable data loss. | Operational/Security | Low | High | Test restore procedures; replicate backups off-site; automate backup verification; monitor logs. | Low |
| 9 | Misconfigured access restrictions to DEI network (VPN/IP whitelist) may block legitimate users. | Operational | Medium | Medium | Document whitelist process; validate configuration changes; maintain rollback plan. | Low |
|10 | Sensitive logs or exposure of sensitive configuration in version control.  | Security | Low | High | Use .gitignore rules; review work thoroughly before committing. | Low |
|11 | Personal data mishandling or GDPR non-compliance may expose the project to legal risk. | Security/Other | Medium | High | Document data flows; restrict access; anonymize logs; follow GDPR guidelines. | Low |
|12 | Configuration file for allowed endpoints (Whitelisting) may contain invalid or outdated entries, blocking system access. | Operational/Technical | Medium | Medium | Validate config format automatically; reload configs live; log invalid lines; maintain versioned configs. | Low |
|13 | Poor documentation or knowledge transfer may obstruct system maintenance. | Operational/Other | Medium | Medium | Maintain up-to-date documentation; conduct internal reviews. | Low |
| 14 | Incomplete audit logging can make it difficult to detect unauthorized activities. | Security/Operational | Medium | Medium | Ensure all critical actions are logged; test audit log coverage; restrict log access. | Low |
|15 | Frontend usability/accessibility issues may reduce user satisfaction or exclude users. | Technical/Other | Medium | Medium | Perform usability/accessibility reviews; use automated tools. | Low |

