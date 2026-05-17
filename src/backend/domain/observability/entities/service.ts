import { ServiceName } from "../../common/value-objects/service-name";

export class Service {
  constructor(
    public readonly id: string,
    public readonly name: ServiceName,
    public readonly ownerTeam: string,
  ) {}
}
