<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Sign-in is phone + fixed code checked in `otpLogin` server fn, which issues a fresh random password per login and the client signs in with it. Why: user wanted a fixed code with no SMS sending.
- AI scanning/chat/translate go through `src/lib/ai.server.ts` (gateway Responses API). The SIM endpoint is `/api/public/sms`. Why: one place for AI calls.


- New accounts get role "user"; admins grant admin via the Admin page (`setAdmin`). Why: no automatic admin escalation.
- SIM endpoint requires a per-user token from `device_secrets` and the phone must match that user. Why: stop forged SMS injection.
- Home, Helper, and Admin content live in separate components rendered by their TanStack leaf routes; bottom-tab state follows the URL and the authenticated layout always renders Outlet. Why: tabs switch actual pages while preserving direct links and browser history.
