import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/public-sans";
import "./style.css";
import App from "./App";
import { VideoScene } from "./VideoScene";
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main>
        <h1>Tampilan tidak dapat dimuat</h1>
        <p>Muat ulang halaman atau buka peta cetak draf.</p>
        <a href="./exports/peta-a4.pdf">Buka PDF draf</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    {new URLSearchParams(location.search).has("video") ? (
      <VideoScene />
    ) : (
      <App />
    )}
  </Boundary>,
);
