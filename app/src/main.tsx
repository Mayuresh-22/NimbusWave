import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import Navigator from "./navigators/navigator.tsx";
import store from "./store/store.ts";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Navigator />
  </Provider>,
);
