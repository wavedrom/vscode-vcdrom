'use strict';

// const path = require('path');
// const fs = require('fs');
const vscode = require('vscode');

const getHtml = obj => {
  return `
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; worker-src * data: 'unsafe-inline' 'unsafe-eval'; font-src * 'unsafe-inline' 'unsafe-eval';">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 fill=%22grey%22 font-size=%2290%22>🌊</text></svg>">
    <title>VCDrom</title>
    <link rel="preload" as="font" href="${obj.local}/iosevka-term-light.woff2" type="font/woff2" crossorigin>
    <script src="${obj.local}/vcdrom.js"></script>
    <script>
    window.addEventListener('load', () => {
      console.log("${obj.local}", "${obj.vcd}");
      VCDrom('waveform1', (handler) => {
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', event => {
          console.log(event);
        });
      });
    });
  </script>

  </head>
  <body>
    <div id="waveform1"></div>
  </body>
</html>
`;
};

const start = context => {
  // console.log(extensionContext);
  return async vcd => {
    // console.log(vcd);

    // let uri = vscode.Uri.joinPath(context.extensionUri, 'app', 'index.html');
    // const indexContentBytes = await vscode.workspace.fs.readFile(uri);
    // const decoder = new TextDecoder();
    // const indexContent = decoder.decode(indexContentBytes);
    // console.log(indexContent);

    // const fullName = vcd.path;
    // const fullNameArr = fullName.split('/');
    // const fileName = fullNameArr.pop();

    // const fileNameArr = fileName.split('.');
    // if (fileNameArr.length > 1) {
    //   fileNameArr.pop(); // remove extention
    // }

    // const title = fileNameArr.join('.');
    // const vcdDir = fullNameArr.join('/');
    // console.log(vcdDir);
    // // const title = path.basename(fname);
    // // const vcdDir = path.dirname(fname);

    // const local = vscode.Uri.file(
    //   // path.join(extensionContext.extensionPath, 'app')
    //   extensionContext.extensionPath + '/app'
    // );

    const panel = vscode.window.createWebviewPanel(
      'vcdrom', // ID
      'title', // title, // Title
      2, // vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // localResourceRoots: [local, vscode.Uri.file(vcdDir)]
      }
    );

    // console.log('panel', panel.webview.asWebviewUri(local));

    panel.webview.html = getHtml({
      local: (
        // 'https://vcd.drom.io'
        // panel.webview.asWebviewUri(local)
        vscode.Uri.joinPath(context.extensionUri, 'app')
      ),
      vcd: (
        panel.webview.asWebviewUri(vcd)
      )
    });

    panel.webview.postMessage('привет');
    // const s1 = fs.createReadStream(vcd.fsPath);
    // for await (const chunk of s1) {
    //   console.log(chunk.length);
    // }
  };
};

const addWaveQL = (extensionContext) => {
  return async waveql => {
    const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    const uri = vscode.Uri.joinPath(workspaceUri, waveql.path);
    const readData = await vscode.workspace.fs.readFile(uri);
    const documentData = new TextDecoder().decode(readData);
    console.log(documentData.text);
    extensionContext.waveQl = {uri, documentData};
    // console.log(workspaceUri);
    // console.log(waveql.path);
    // console.log(uri);
    // console.log(context);
    // console.log(waveql);
    // // console.log(vscode.workspace.fs);
    // console.log(context.extensionUri); // vscode.Uri.joinPath('.', '.'));
    // // console.log(vscode.workspace.fs.readFile(waveql.path));
    // console.log(vscode.workspace.Uri);
    // const uri = vscode.Uri.joinPath(context.extensionUri, waveql.path);
    // console.log(uri);
    // console.log(readData);
  };
};

const addVCD = (extensionContext) => {
  return async vcd => {
    console.log(vcd);
    extensionContext.VCD = extensionContext.VCD || [];
    extensionContext.VCD.push(vcd);
  };
};

const addLST = (extensionContext) => {
  return async lst => {
    console.log(lst);
    extensionContext.LST = extensionContext.LST || [];
    extensionContext.LST.push(lst);
  };
};

const editor = (extensionContext) => {
  console.log(extensionContext);
  return {
    backupCustomDocument: async function (
      document, //: T,
      context, //: CustomDocumentBackupContext,
      cancellation // : CancellationToken
    ) { // : Thenable<CustomDocumentBackup>
      console.log('backupCustomDocument', document, context, cancellation);
    },
    openCustomDocument: async function (
      uri /* : Uri */,
      openContext /* : CustomDocumentOpenContext */,
      token /* : CancellationToken */
    ) { // ): T | Thenable<T>
      console.log('openCustomDocument', uri, openContext, token);
      const readData = await vscode.workspace.fs.readFile(uri);
      const documentData = new TextDecoder().decode(readData);
      console.log(documentData.length);
      return {
        get uri() {
          console.log('get uri');
          return uri;
        },
        get documentData() {
          console.log('get documentData');
          return documentData;
        },
        dispose: () => {
          console.log('dispose');
        }
      };
    },
    resolveCustomEditor: async function (
      document /* : T */,
      webviewPanel /* : WebviewPanel */,
      token /* : CancellationToken */
    ) { // : void | Thenable<void>
      console.log('resolveCustomEditor');
      // console.log(document, webviewPanel, token);

      webviewPanel.webview.options = {
        enableScripts: true,
        retainContextWhenHidden: true
      };

      webviewPanel.webview.html = getHtml({
        local: (
          // 'https://vcd.drom.io'
          // panel.webview.asWebviewUri(local)
          vscode.Uri.joinPath(extensionContext.extensionUri, 'app')
        ),
        vcd: 'vcd' // (
        // webviewPanel.webview.asWebviewUri(vcd)
        //)
      });

      webviewPanel.webview.postMessage('привет');

    },
    revertCustomDocument: async function (
      document /* : T */,
      cancellation /* : CancellationToken */
    ) { // }: Thenable<void>
      console.log('revertCustomDocument', document, cancellation);
    },
    saveCustomDocument: async function (
      document /* : T */,
      cancellation /* : CancellationToken */
    ) { // : Thenable<void>
      console.log('saveCustomDocument', document, cancellation);
    },
    saveCustomDocumentAs: async function (
      document /* : T */,
      destination /* : Uri */,
      cancellation /* : CancellationToken*/
    ) { // : Thenable<void>
      console.log('saveCustomDocumentAs', document, destination, cancellation);
    }
  };
};

exports.activate = extensionContext => {
  console.log('VCDrom is activated!');
  extensionContext.subscriptions.push(
    vscode.commands.registerCommand('vcdrom.start', start(extensionContext)),
    vscode.commands.registerCommand('vcdrom.addWaveQL', addWaveQL(extensionContext)),
    vscode.commands.registerCommand('vcdrom.addVCD', addVCD(extensionContext)),
    vscode.commands.registerCommand('vcdrom.addLST', addLST(extensionContext)),
    vscode.window.registerCustomEditorProvider('vcdrom.editor', editor(extensionContext))
  );
};

exports.deactivate = () => {
  console.log('vcdrom is deactivated!');
};
