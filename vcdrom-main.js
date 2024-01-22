(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vcdrom = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

const vscode = require('vscode');

const textDecoder = new TextDecoder('utf-8');

const getHtml = obj => `
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; worker-src * data: 'unsafe-inline' 'unsafe-eval'; font-src * 'unsafe-inline' 'unsafe-eval';">
    <script src="${obj.local}/vcdrom-view.js"></script>
    <style>
      @font-face {
        font-family: 'Iosevka Drom Web';
        font-display: swap;
        font-weight: 400;
        font-stretch: normal;
        font-style: normal;
        src: url('${obj.local}/IosevkaDrom-Regular.woff2') format('woff2');
      }

      @font-face {
        font-family: 'Iosevka Drom Web';
        font-display: swap;
        font-weight: 400;
        font-stretch: normal;
        font-style: oblique;
        src: url('${obj.local}/IosevkaDrom-Oblique.woff2') format('woff2');
      }

      @font-face {
        font-family: 'Iosevka Drom Web Oblique';
        font-display: swap;
        font-weight: 400;
        font-stretch: normal;
        src: url('${obj.local}/IosevkaDrom-Oblique.woff2') format('woff2');
      }

      @font-face {
        font-family: 'Iosevka Drom Web';
        font-display: swap;
        font-weight: 400;
        font-stretch: normal;
        font-style: italic;
        src: url('${obj.local}/IosevkaDrom-Italic.woff2') format('woff2');
      }
    </style>
  </head>
  <body class="vcdrombody" onload="VCDromView('waveform1')">
    <div id="waveform1"></div>
  </body>
</html>
`;

let webviewPanels = [];

const addVCD = (/* extensionContext */) => {
  return async vcd => {
    console.log('addVCD', vcd);
    const activeVCDromPanel = webviewPanels.find(e => (e.viewType === 'vcdrom.editor') && e.active);
    if (activeVCDromPanel) {
      // https://github.com/microsoft/vscode/issues/105299
      // e.title = 'vcd';
      try {
        const rawContent = await vscode.workspace.fs.readFile(vcd);
        const vcdText = textDecoder.decode(rawContent);
        activeVCDromPanel.webview.postMessage({
          kind: 'loadVCD',
          name: vcd.path,
          text: vcdText
        });
      } catch (e) {
        console.warn(`Error reading file ${vcd}`, e);
      }
    }
  };
};

const addLST = (/* extensionContext */) => {
  return async lst => {
    console.log('addLST', lst);
    const activeVCDromPanel = webviewPanels.find(e => (e.viewType === 'vcdrom.editor') && e.active);
    if (activeVCDromPanel) {
      try {
        const rawContent = await vscode.workspace.fs.readFile(lst);
        const lstText = textDecoder.decode(rawContent);
        activeVCDromPanel.webview.postMessage({
          kind: 'loadLST',
          name: lst.path,
          text: lstText
        });
      } catch (e) {
        console.warn(`Error reading file ${lst}`, e);
      }
    }
  };
};


const updateTextDocument = (document, text) => {
  console.log('->', document.getText().length, text.length);
  if (document.getText() !== text) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      text
    );
    return vscode.workspace.applyEdit(edit);
  }
};

const textEditor = (extensionContext) => {
  console.log('textEditor', extensionContext);
  return { // vscode.CustomTextEditorProvider
    resolveCustomTextEditor: async function (
      document /* : TextDocument */,
      webviewPanel /* : WebviewPanel */
      // token /* : CancellationToken */
    ) { // : void | Thenable<void>
      console.log('resolveCustomTextEditor');

      webviewPanels.push(webviewPanel);
      webviewPanel.onDidDispose(() => {
        webviewPanels = webviewPanels.filter(wp => wp !== webviewPanel);
      });

      webviewPanel.webview.options = {
        enableScripts: true,
        retainContextWhenHidden: true
      };

      webviewPanel.webview.html = getHtml({
        local: (
          webviewPanel.webview.asWebviewUri(
            // vscode.Uri.joinPath(extensionContext.extensionUri, 'app')
            extensionContext.extensionUri
          )
        )
      });

      const updateWebview = () => {
        console.log('updateWebview');
        webviewPanel.webview.postMessage({
          kind: 'loadWaveQL',
          text: document.getText()
        });
      };

      const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        console.log('onDidChangeTextDocument');
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      });

      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
      });

      webviewPanel.webview.onDidReceiveMessage(e => {
        switch (e.kind) {
        case 'waveql.update':
          if (e.text) {
            updateTextDocument(document, e.text);
          }
          break;
        case 'loaded':
          updateWebview();
          break;
        }
      });
    }
  };
};

exports.activate = extensionContext => {
  console.log('VCDrom is activated!', extensionContext);
  extensionContext.subscriptions.push(
    vscode.commands.registerCommand('vcdrom.addVCD', addVCD(extensionContext)),
    vscode.commands.registerCommand('vcdrom.addLST', addLST(extensionContext)),
    vscode.window.registerCustomEditorProvider(
      'vcdrom.editor',
      textEditor(extensionContext),
      {webviewOptions: {retainContextWhenHidden: true}}
    )
  );
};

exports.deactivate = () => {
  console.log('vcdrom is deactivated!');
};

},{"vscode":"vscode"}]},{},[1])(1)
});
