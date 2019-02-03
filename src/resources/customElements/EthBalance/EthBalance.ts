import { EventAggregator } from 'aurelia-event-aggregator';
import { autoinject, bindable, bindingMode, containerless, customElement } from 'aurelia-framework';
import { DisposableCollection } from 'services/DisposableCollection';
import { BigNumber, Web3Service } from '../../../services/Web3Service';

@autoinject
@containerless
@customElement('ethbalance')
export class EthBalance {
  @bindable({ defaultBindingMode: bindingMode.toView }) public placement: string = 'top';

  private balance: BigNumber;
  private filter: any;
  private subscriptions = new DisposableCollection();

  constructor(
    private web3: Web3Service,
    private eventAggregator: EventAggregator) {
  }

  public attached() {
    this.subscriptions.push(this.eventAggregator.subscribe('Network.Changed.Account', () => { this.initialize(); }));
    this.subscriptions.push(this.eventAggregator.subscribe('Network.Changed.Id', () => { this.initialize(); }));
    this.initialize();
  }

  private initialize() {
    this.stop();
    this.readBalance();
  }

  private stop() {
    if (this.filter) {
      this.filter.stopWatching();
      this.filter = null;
    }
  }

  private detached() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }

    this.stop();
  }

  private async readBalance() {
    /**
     * this is supposed to fire whenever a new block is created
     */
    this.filter = this.web3.eth.filter({ fromBlock: 'latest' }).watch(() => {
      this.getBalance();
    });
    return this.getBalance();
  }

  private async getBalance() {
    try {
      const ethAddress = this.web3.defaultAccount;
      this.balance = await this.web3.getBalance(ethAddress);
      // tslint:disable-next-line:no-empty
    } catch (ex) {
    }
  }
}
