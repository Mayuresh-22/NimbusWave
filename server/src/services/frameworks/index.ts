import ViteReactProcessor from "./vite-react";


const VITE_REACT = "vite_react";
const REACT = "react";
const VUE = "vue";

export interface FrameworkProcessor {
  processor: (
    indexHTMLFileBuffer: string,
    replacers: { [key: string]: string },
    pathStartWithSlash: boolean
  ) => string;
}

const FRAMEWORK_PROCESSORS: {[key: string]: FrameworkProcessor} = {
  [VITE_REACT]: { processor: ViteReactProcessor.process },
};

export default FRAMEWORK_PROCESSORS;