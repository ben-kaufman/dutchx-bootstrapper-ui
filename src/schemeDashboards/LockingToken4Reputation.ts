import { autoinject } from 'aurelia-framework';
import { Address, LockingToken4ReputationWrapper, StandardTokenFactory, StandardTokenWrapper, TokenLockingOptions, LockInfo } from "../services/ArcService";
import { Locking4Reputation } from 'schemeDashboards/Locking4Reputation';
import { AureliaConfiguration } from "aurelia-configuration";
import { EventAggregator } from "aurelia-event-aggregator";
import { Web3Service } from "services/Web3Service";
import { EventConfigFailure, EventConfigException } from "entities/GeneralEvents";

@autoinject
export class LockingToken4Reputation extends Locking4Reputation {

  constructor(
    private appConfig: AureliaConfiguration
    , eventAggregator: EventAggregator
    , web3Service: Web3Service
  ) {
    super(eventAggregator, web3Service);
  }

  private lockableTokens: Array<TokenSpecification>;
  private selectedToken: TokenSpecification = null;
  protected wrapper: LockingToken4ReputationWrapper;

  protected async refresh() {
    this.lockableTokens = this.appConfig.get("lockableTokens");
    await super.refresh();
  }

  protected async lock(): Promise<boolean> {

    if (!this.selectedToken) {
      this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Please select a token`));
      return;
    }

    (<TokenLockingOptions>this.lockModel).tokenAddress = this.selectedToken.address;

    try {

      if (!(await this.getLockBlocker())) {

        const token = (await StandardTokenFactory.at(this.selectedToken.address)) as StandardTokenWrapper;

        await (await token.approve({
          owner: this.lockModel.lockerAddress,
          amount: this.lockModel.amount,
          spender: this.wrapper.address
        })).watchForTxMined();

        return super.lock(true);
      }
    }
    catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException(`The token transfer could not be approved`, ex));
    }
    return false;
  }

  selectToken(tokenSpec: TokenSpecification) {
    this.selectedToken = tokenSpec;
  }

  protected async getLockUnit(lockInfo: LockInfo): Promise<string> {

    const token = await this.wrapper.getTokenForLock(lockInfo.lockId);
    const found = this.lockableTokens.filter((tokenSpec: TokenSpecification) => {
      return tokenSpec.address.toLowerCase() === token.address;
    });
    return found.length >= 1 ? found[0].symbol : "N/A";
  }
}

interface TokenSpecification {
  symbol: string;
  address: Address;
}
