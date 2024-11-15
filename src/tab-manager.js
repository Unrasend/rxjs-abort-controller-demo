import { AbortControllerSearch } from './abort-controller-search.js';
import { RxJSSearch } from './rxjs-search.js';

export class TabManager {
    tabs = [];

    constructor(containerId, useRxJS = false) {
        this.useRxJS = useRxJS;
        this.setupDOM(containerId);
        this.bindEvents();
        this.addTab();
    }

    setupDOM(containerId) {
        const template = `
            <div class="tabs-wrapper">
                <div class="tabs-header">
                    <div class="tabs-list"></div>
                    <button class="new-tab-btn">+ New Tab</button>
                </div>
                <div class="tabs-content"></div>
            </div>
        `;

        this.container = document.getElementById(containerId);
        this.container.innerHTML = template;
        this.tabsContainer = this.container.querySelector('.tabs-list');
        this.contentContainer = this.container.querySelector('.tabs-content');
    }

    bindEvents() {
        const newTabBtn = this.container.querySelector('.new-tab-btn');
        newTabBtn.addEventListener('click', () => this.addTab());

        this.tabsContainer.addEventListener('click', (e) => {
            const target = e.target;
            const tabElement = target.closest('[data-tab-id]');

            if (!tabElement) return;

            const tabId = tabElement.getAttribute('data-tab-id');

            if (target.classList.contains('tab-close')) {
                this.closeTab(tabId);
            } else {
                this.activateTab(tabId);
            }
        });
    }

    addTab() {
        const tabId = `tab-${Date.now()}`;
        const newTab = {
            id: tabId,
            title: `Search ${this.tabs.length + 1}`
        };

        this.tabs.push(newTab);
        this.renderTabs();
        this.activateTab(tabId);
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];
        if (tab.searchWidget) {
            tab.searchWidget.cleanup();
        }

        this.tabs.splice(tabIndex, 1);

        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newActiveIndex = Math.max(0, tabIndex - 1);
                this.activeTabId = this.tabs[newActiveIndex].id;
            } else {
                this.activeTabId = null;
                this.addTab();
                return;
            }
        }

        this.renderTabs();
        this.renderContent();
    }

    activateTab(tabId) {
        if (this.activeTabId && this.activeTabId !== tabId) {
            const prevTab = this.tabs.find(tab => tab.id === this.activeTabId);
            if (prevTab?.searchWidget) {
                prevTab.searchWidget.cleanup();
                prevTab.searchWidget = undefined;
            }
        }

        this.activeTabId = tabId;
        this.renderTabs();
        this.renderContent();
    }

    renderTabs() {
        this.tabsContainer.innerHTML = this.tabs
            .map(tab => `
                <div class="tab ${tab.id === this.activeTabId ? 'active' : ''}"
                     data-tab-id="${tab.id}">
                    <span class="tab-title">${tab.title}</span>
                    <button class="tab-close">×</button>
                </div>
            `)
            .join('');
    }

    renderContent() {
        this.contentContainer.innerHTML = '';

        if (!this.activeTabId) return;

        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        if (!activeTab.searchWidget) {
            activeTab.searchWidget = this.useRxJS
                ? new RxJSSearch()
                : new AbortControllerSearch();
        }
    }

    cleanup() {
        this.tabs.forEach(tab => {
            if (tab.searchWidget) {
                tab.searchWidget.cleanup();
            }
        });
        this.container.innerHTML = '';
    }
}