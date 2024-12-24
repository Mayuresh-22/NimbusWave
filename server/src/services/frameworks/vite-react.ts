
class ViteReactProcessor {
  process(
    indexHTMLFileBuffer: string,
    replacers: { [key: string]: string },
    pathStartWithSlash: boolean = true
  ): string {
    let processedHTML = indexHTMLFileBuffer;
    console.log("------------------------- Processing Vite React HTML file... ---------------------------------");
    console.log(processedHTML+"\n");
    console.log("Replacers: " + JSON.stringify(replacers, null, 2));
    for (const [key, value] of Object.entries(replacers)) {
      const regex = new RegExp(`${pathStartWithSlash ? '/' : ''}${key}`, 'g');
      processedHTML = processedHTML.replace(regex, value);
    }
    console.log("Processed HTML: " + processedHTML);
    console.log("---------------------------------------------------------------------------------------------");
    return processedHTML;
  }
}

export default new ViteReactProcessor();