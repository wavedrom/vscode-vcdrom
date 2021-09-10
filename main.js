'use strict';

const path = require('path');
const vscode = require('vscode');

exports.activate = function (context) {
  console.log('vcdrom is activated!');

  const disposable = vscode.commands.registerCommand('vcdrom.start', async () => {

    const panel = vscode.window.createWebviewPanel(
      'vcdrom', // ID
      'VCDrom', // Title
      2, // vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'assets'))
        ]
      }
    );
    panel.webview.html = context;
  });

  context.subscriptions.push(disposable);
};

exports.deactivate = function () {
  console.log('vcdrom is deactivated!');
};

/* eslint no-console: 0 */
