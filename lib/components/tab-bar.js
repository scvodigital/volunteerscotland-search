import { MDCTabBar } from '@material/tab-bar';

export class TabBarComponent {
  constructor(tabBar) {
    this.$tabBar = $(tabBar);
    this.options = this.$tabBar.data('tab-bar');

    this.tabBar = new MDCTabBar(this.$tabBar[0]);
    this.tabBar.listen("MDCTabBar:activated", this.tabChanged.bind(this));

    if (this.options.defaultTabIdentifier === 'hash') {
      this.defaultTab = window.location.hash.replace('#', '');
      window.addEventListener("hashchange", (evt) => {
        //console.log('HASHCHANGED:', evt);
        const tab = window.location.hash.replace('#', '');
        this.changeTab(tab);
      }, false);
    } else if (this.options.defaultTabIdentifier) {
      let search = window.location.search;
      try {
        if (search && search.length > 0) {
          search = search.substring(1);
          const query = JSON.parse(
            '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
            (key, value) => { return key === "" ? value : decodeURIComponent(value); }
          );
          if (query.hasOwnProperty(this.options.defaultTabIdentifier)) {
            this.defaultTab = query[this.options.defaultTabIdentifier];
          }
        }
      } catch(err) {
        console.error('Failed to get default tab from querystring', this.options.defaultTabIdentifier, search, err);
      }
    }

    this.changeTab(this.defaultTab);
  }

  changeTab(tabName) {
    if (tabName) {
      var tab = this.findTab(tabName);
      if (tab.index > -1) {
        this.tabBar.activateTab(tab.index);
      }
    }
  }

  findTab(findName) {
    for (var t = 0; t < this.tabBar.tabList_.length; ++t) {
      var tab = this.tabBar.tabList_[t];
      var tabName = $(tab.root_).data('tab-name') || 'tab-' + t;
      if (findName === tabName) {
        return { tab: tab, index: t };
      }
    }
    return { tab: null, index: -1 };
  }

  tabChanged(evt) {
    //console.log('TABCHANGED:', evt);
    const tabIndex = evt.detail.index;
    const tab = this.tabBar.tabList_[tabIndex];
    const tabName = $(tab.root_).data('tab-name') || 'tab-' + tabIndex;
    const tabBarId = this.$tabBar.attr('id');
    if (!tabBarId) return;
    const $panelsContainer = $('[for="' + tabBarId + '"]');
    if (!$panelsContainer || $panelsContainer.length === 0) return;
    $panelsContainer.find('[data-tab-name]').hide();
    $panelsContainer.find('[data-tab-name="' + tabName + '"]').show();
    window.location.hash = tabName;
  }
}