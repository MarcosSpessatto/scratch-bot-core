// Polyfills
import 'es6-object-assign/auto';
import 'core-js/fn/array/includes';
import 'core-js/fn/promise/finally';
import 'intl'; // For Safari 9

import React from 'react';
import ReactDOM from 'react-dom';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import BrowserModalComponent from '../components/browser-modal/browser-modal.jsx';
import supportedBrowser from '../lib/supported-browser';
import 'materialize-css/dist/css/materialize.css';
import styles from './index.css';
import { RocketForm } from '../rocket-chat-integration';
import M from 'materialize-css';
import BackgroundImage from '../../static/background.jpg';
M.AutoInit();

const appTarget = document.createElement('div');
appTarget.className = styles.app;
document.body.appendChild(appTarget);

const onRocketRegisterDone = () => {
    document.body.style.backgroundImage = '';
    if (supportedBrowser()) {
        // require needed here to avoid importing unsupported browser-crashing code
        // at the top level
        require('./render-gui.jsx').default(appTarget);

    } else {
        BrowserModalComponent.setAppElement(appTarget);
        const WrappedBrowserModalComponent = AppStateHOC(BrowserModalComponent, true /* localesOnly */);
        const handleBack = () => { };
        // eslint-disable-next-line react/jsx-no-bind
        ReactDOM.render(<WrappedBrowserModalComponent onBack={handleBack} />, appTarget);
    }
}
if (localStorage.getItem('rocketUser')) {
    onRocketRegisterDone();
} else {
    document.body.style.backgroundImage = `url(${BackgroundImage})`;
    ReactDOM.render(<RocketForm onRocketRegisterDone={onRocketRegisterDone} />, appTarget);
}
