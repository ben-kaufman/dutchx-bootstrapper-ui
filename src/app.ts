import { autoinject, LogManager } from 'aurelia-framework';
import { Router, RouterConfiguration, NavigationInstruction } from 'aurelia-router';
import { PLATFORM } from 'aurelia-pal';
import { Web3Service } from "./services/Web3Service";
import { ArcService } from "./services/ArcService";
import '../static/styles.scss';
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject
export class App {
  router: Router;
  private isConnected: boolean;
  private logger = LogManager.getLogger("DxBootStrapper");
  private healthy: boolean = false;

  constructor(
    private web3: Web3Service,
    private arcService: ArcService,
    eventAggregator: EventAggregator
  ) {
    this.initialize();
    eventAggregator.subscribe("Network.Changed.Id", () => {
      this.initialize();
    });
  }

  initialize() {
  }

  attached() {
    /* override the body style set in the splash screen */
    (<any>$('body'))
      .css({
        "color": "black",
        "background-color": "white"
      })
      .bootstrapMaterialDesign({ global: { label: { className: "bmd-label-floating" } } });
  }


  configureRouter(config: RouterConfiguration, router: Router) {

    config.title = 'DutchX Reputation Bootstrapper';

    /**
     * first set the landing page.
     * it is possible to be connected but have the wrong chain.
     */
    config.map([
      {
        route: ['noDao'],
        name: 'noDao',
        moduleId: PLATFORM.moduleName('./error-pages/noDao/noDao'),
        nav: false,
        title: 'DAO Not Found'
      },
      {
        route: ['noaccount'],
        name: 'noaccount',
        moduleId: PLATFORM.moduleName('./error-pages/noaccount/noaccount'),
        nav: false,
        title: 'No Account'
      },
      /**
       * not connected and/or couldn't get the daostack addresses, either way treat as not connected
       */
      {
        route: ['notconnected'],
        name: 'notconnected',
        moduleId: PLATFORM.moduleName('./error-pages/notconnected/notconnected'),
        nav: false,
        title: 'Not Connected'
      },
      {
        // 'address' will be present in the object passed to the 'activate' method of the viewmodel
        // DutchX: set address to be optional, and this page as the default (instead of Home)
        route: ['', 'daoDashboard/:address?'],
        name: 'daoDashboard',
        moduleId: PLATFORM.moduleName('./organizations/dashboard'),
        nav: false,
        title: 'Dashboard'
      }
      , {
        // 'txHash' will be present in the object passed to the 'activate' method of the viewmodel
        route: ['txInfo/:txHash'],
        name: 'txInfo',
        moduleId: PLATFORM.moduleName('./txInfo/txInfo'),
        nav: false,
        title: 'Transaction Information'
      }
    ]);

    config.fallbackRoute('');

    this.router = router;
  }

  static SchemeDashboards = [
    "Auction4Reputation",
    "ContributionReward",
    "ExternalLocking4Reputation",
    "FixedReputationAllocation",
    "GenesisProtocol",
    "GlobalConstraintRegistrar",
    "LockingEth4Reputation",
    "LockingToken4Reputation",
    "NonArc",
    "SchemeRegistrar",
    "UpgradeScheme",
  ];

  public static hasDashboard(schemeName: string): boolean {
    return App.SchemeDashboards.indexOf(schemeName) !== -1;
  }

  public getLandingPageRoute(): string {
    /**
     * can be connected 
     */
    const haveDAOstack = !!this.arcService.arcContracts;
    const isConnected = this.web3.isConnected;
    const noAccount = !this.web3.defaultAccount;

    this.isConnected = isConnected && haveDAOstack;

    if (isConnected && noAccount) {
      return "noaccount";
    }
    else if (!haveDAOstack) {
      return "notconnected";
    }
    else {
      return "";
    }
  }

  public navigateToLandingPage(): boolean {
    const route = this.getLandingPageRoute();
    this.router.navigate(route);
    return (route === "");
  }
}
