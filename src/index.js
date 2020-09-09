import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import store from "./app/store";
import { Provider } from "react-redux";
import * as serviceWorker from "./serviceWorker";
import StoreProvider from "./features/webex/webexStore";
import FilesProvider from "./features/files/filesStore";
import ComposeProvider from "./features/compose/composeStore";
// import { MessageComposer } from "./components/Space/Message/Composer/MessageComposer";

const initWidget = ({ token, onEvent }, DOMNode) => {
  ReactDOM.render(
    <React.StrictMode>
      <StoreProvider>
        <FilesProvider>
          <ComposeProvider>
            <Provider store={store}>
              <App token={token} onEvent={onEvent} />
              {/* <MessageComposer /> */}
            </Provider>
          </ComposeProvider>
        </FilesProvider>
      </StoreProvider>
    </React.StrictMode>,
    DOMNode
  );
};

const removeWidget = DOMNode => {
  ReactDOM.unmountComponentAtNode(DOMNode);
};

// Select the node that will be observed for mutations
const targetNode = document.getElementById("root");

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

// onEvent function for now
const onEvent = event => console.log(event);

// Callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
  // Use traditional 'for loops' for IE 11
  for (let mutation of mutationsList) {
    if (mutation.type === "attributes" && mutation.attributeName === "load") {
      const name = mutation.target.attributes[mutation.attributeName].value;
      if (name && name === "true") {
        const token = document.getElementById("root").getAttribute("token");
        initWidget({ token, onEvent }, document.getElementById("root"));
      } else {
        removeWidget(document.getElementById("root"));
      }
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

export default initWidget;

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
