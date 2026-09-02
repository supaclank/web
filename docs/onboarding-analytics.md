# Onboarding analytics

The guided setup uses the existing Umami tracker and first-party relay. Events are disabled unless both public Umami settings and the tracked hostname are configured. Session recording remains disabled on `/get-started` and `/welcome`.

| Event | When it fires | Additional properties |
| --- | --- | --- |
| `Onboarding Opened` | The question modal opens, including edits and explicit reopens. | `step`, `is_edit` |
| `Onboarding Step Completed` | Continue or Show my setup is pressed with a valid answer. Revisits and save retries count as interactions. | `step`, `is_edit` |
| `Onboarding Dismissed` | The user closes the modal with X or Escape. Navigation/unmount is not a dismissal. | `step`, `is_edit` |
| `Onboarding Completed` | The full modal submission succeeds. On `/welcome`, this requires a successful account save. Hydration, signup handoffs, and inline edits do not fire it. | `is_edit` |
| `Onboarding Setup Viewed` | A personalized setup is displayed, including resumed setups and changed choices. Identical rerenders and reordered selections are deduplicated within that component instance. | — |
| `Onboarding Saved` | Supabase successfully persists the choices. | `source`: `modal`, `inline`, or `handoff` |
| `Onboarding Save Failed` | An account save fails. Retrying preserves the original source. | Only `placement` and `source`; no error details. |
| `Onboarding Action` | A setup action is taken. | `action` |

Common properties are `onboarding_version`, `placement` (`get-started` or `welcome`), `build_targets`, `devices`, and `usage` (`local` or `cloud`). Unanswered choices are omitted. Multi-select values have a stable order: `web`, `mobile`, or `web+mobile`; `laptop`, `mobile`, or `laptop+mobile`. Steps are `build`, `devices`, and `usage`. `is_edit` means an existing setup was present when the modal was opened/submitted.

Actions are `cloud_signup`, `save_account`, `app_download`, `app_qr_shown`, `copy_install`, `copy_pair`, `copy_preview`, and `open_repository`. Copy events require clipboard success; repository events require valid input. QR exposure is recorded once per badge instance after its desktop popover becomes visible. The action properties describe the setup displayed when the action was taken, so a local user following the cloud recommendation has `usage=local` and `action=cloud_signup`.

Use Opened → Step Completed (filtered by step) → Completed → Action for the question funnel. Apply `is_edit=false` to the modal events when measuring new setups. For users arriving with saved choices, start at Setup Viewed. Compare local and cloud paths using `usage`, and use Saved with `source=handoff` to measure choices reaching an account after signup. These are interaction events: app-store visits, QR displays, and command copies do not prove installation or activation. Signup handoffs do not create a second onboarding completion.

Payloads explicitly allowlist enum choices and action names. They do not include account IDs, emails, repository input, commands, or raw errors. Existing URL sanitization strips onboarding query parameters and nested signup return paths. No additional cross-device identifier or session recording is introduced.
