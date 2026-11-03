import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Keeps a render error from turning into a black screen: the message is shown
 * together with a reload and a "reset save" button.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("Retro Kənd xəta:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#5fb8e0] p-4">
        <div className="w-full max-w-sm border-4 border-[#4a2d1c] bg-[#d9453b] p-4 text-white shadow-[5px_5px_0_rgba(0,0,0,0.5)]">
          <h1 className="mb-1 text-3xl" style={{ textShadow: "2px 2px 0 #4a2d1c" }}>
            Xəta / Error
          </h1>
          <p className="mb-3 text-xl leading-5">
            Oyun gözlənilmədən dayandı. Zəhmət olmasa bu yazını screenshot edib göndərin:
          </p>
          <pre className="mb-3 max-h-40 overflow-auto whitespace-pre-wrap border-2 border-[#4a2d1c] bg-[#3a2a1e] p-2 text-base leading-4 text-[#fbd54a]">
            {e.name}: {e.message}
          </pre>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="px-btn orange"
              onClick={() => window.location.reload()}
            >
              Yenidən yüklə / Reload
            </button>
            <button
              type="button"
              className="px-btn gray sm"
              onClick={() => {
                try {
                  localStorage.removeItem("retro_kend_save_v1");
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
            >
              Save-i sıfırla və yenidən başla
            </button>
          </div>
        </div>
      </div>
    );
  }
}
