'use strict';

const {StyleModule} = require('style-mod');

const {
  createCodeMirrorState,
  mountCodeMirror6
} = require('waveql');

const createVCD = require('vcd-stream/out/vcd.js');
const webVcdParser = require('vcd-stream/lib/web-vcd-parser.js');
const vcdPipeDeso = require('vcd-stream/lib/vcd-pipe-deso.js');
const getVcd = require('vcd-stream/lib/get-vcd.js');

const {
  domContainer,
  pluginRenderValues,
  pluginRenderTimeGrid,
  keyBindo,
  mountTree,
  getElement,
  getListing,
  // // renderMenu,
  // // mountCodeMirror5,
  genKeyHandler,
  genOnWheel,
  themeAll,
  // helpPanel
} = require('@wavedrom/doppler');

const pkg = require('../package.json');

const loadVCD = async (mod, cnt, initDeso, data, done) => {
  const inst = await webVcdParser(mod); // VCD parser instance
  vcdPipeDeso(initDeso, inst, (deso) => {
    cnt.start(deso);
    deso.render();
    console.log('vcdPipeDeso done');
  });
  const reader = {
    ext: 'vcd',
    baseName: data.name,
    reader: {
      read: async () => {
        return {done: true, value: data.text};
      }
    }
  };
  await getVcd([reader], {
    set innerHTML (msg) {
      console.log(msg);
    }
  }, inst);
  done();
};

const loadLST = async (deso, data, done) => {
  const reader = {
    ext: 'lst',
    baseName: data.name,
    reader: {
      read: async () => {
        return {done: true, value: data.text};
      }
    }
  };
  console.log('loadLST reader', reader, data);
  deso.listing = await getListing([reader]);
  done();
};

global.VCDromView = async (divName) => {
  console.log(pkg.name, pkg.version);
  const rootDiv = getElement(divName);

  const vscode = acquireVsCodeApi();

  // add all CSS styles
  StyleModule.mount(document, new StyleModule(Object.assign(themeAll, {
    '.vcdrombody': themeAll.body,
  })));

  const cnt1 = domContainer({
    elemento: mountTree.defaultElemento,
    layers: mountTree.defaultLayers,
    renderPlugins: [
      pluginRenderTimeGrid,
      pluginRenderValues
    ]
  });

  // const elo = mountTree.createElemento(mountTree.defaultElemento);
  // const container = mountTree.createContainer(elo, mountTree.defaultLayers);
  rootDiv.innerHTML = '';
  rootDiv.appendChild(cnt1.pstate.container);

  const updater = (str) => {
    console.log('updater');
    deso.waveql = str;
    vscode.postMessage({
      kind: 'waveql.update',
      text: str
    });
  };

  const deso = {
    wires: {body: []},
    listing: [],
    render: () => { console.log('dummy render'); },
    updater
  };


  const cmState = createCodeMirrorState(
    deso,
    cnt1.pstate
  );

  const cm = mountCodeMirror6(
    cmState,
    cnt1.elo.waveqlPanel,
    deso,
    cnt1.pstate
  );
  cnt1.elo.container.addEventListener('keydown', genKeyHandler.genKeyHandler(rootDiv, cnt1.pstate, deso, cm, keyBindo));
  cnt1.elo.container.addEventListener('wheel', genOnWheel(rootDiv, cnt1.pstate, deso, cm, keyBindo));
  cm.view.focus();

  const mod = await createVCD();
  // const vd = await mountWaves(mod, deso, elo, pstate, renderHandler);

  window.addEventListener('message', event => {
    const {data} = event;
    switch (data.kind) {
    case 'loadWaveQL':
      if (data.text !== deso.waveql) {
        console.log('loadWaveQL');
        deso.waveql = data.text;
        // cnt1.pstate.waveql = data.text;
        cm.view.dispatch({changes: {
          from: 0, to: cm.view.state.doc.length, insert: data.text
        }});
      }
      break;
    case 'loadVCD':
      loadVCD(mod, cnt1, deso, data, () => {
        cm.view.dispatch({changes: {
          from: 0, to: cm.view.state.doc.length, insert: deso.waveql
        }});
        // cm.view.dispatch({changes: {from: 0, insert: ' '}});
        // cm.view.dispatch({changes: {from: 0, to: 1, insert: ''}});
        // cm.view.setState(createCodeMirrorState(
        //   deso,
        //   cnt1.pstate
        // ));
        // vscode.postMessage({
        //   kind: 'loaded'
        // });
        console.log('loadVCD done', deso);
      });
      break;
    case 'loadLST':
      loadLST(deso, data, () => {
        cm.view.dispatch({changes: {
          from: 0, to: cm.view.state.doc.length, insert: deso.waveql
        }});
        console.log('loadLST done', deso);
      });
      break;
    default:
      console.log('-> Client', event);
    }
  });

  vscode.postMessage({
    kind: 'loaded'
  });

  // console.log('webVcdParser', inst);

};

/* eslint-env browser */
/* global acquireVsCodeApi */
