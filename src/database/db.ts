import { exit } from "process";
import { Sequelize, Model, DataTypes, where } from "sequelize";

export class Address extends Model {
  declare id: Number;
  declare address: string;
}
export class Round extends Model {
  declare id: Number;
  declare epoch: Number;
  declare priceEnd: Number;
  declare priceStart: Number;
}
export class RoundParticipation extends Model {
  declare roundId: Number;
  declare addressId: Number;
  declare upBid: boolean;
  declare amountBid: Number;
  declare claimed: boolean;
  declare claimedByAnyoneTimestamp: bigint;
}

export class Game extends Model {
  declare id: Number;
  declare contractId: string;
}

export function initDb(sequelize: Sequelize, sync: boolean) {
  Address.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: "Address",
    }
  );

  Round.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      epoch: {
        type: DataTypes.NUMBER,
        allowNull: false,
        unique: false,
      },
      priceEnd: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0 },
      priceStart: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0 },
      sideWon: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Round",
    }
  );

  RoundParticipation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      side: DataTypes.BOOLEAN,
      amountBid: DataTypes.BIGINT,
      claimed: DataTypes.BOOLEAN,
      claimedByAnyoneTimestamp: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "RoundParticipation",
    }
  );

  Game.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      contractId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Game",
    }
  );

  Address.belongsToMany(Round, { through: RoundParticipation });
  Round.belongsToMany(Address, { through: RoundParticipation });
  Game.belongsToMany(Game, {as: "notused" , through: RoundParticipation })
  //Game.belongsToMany(Round, {through: RoundParticipation })

  Game.hasMany(Address)
  Game.hasMany(Round)
  Game.hasMany(RoundParticipation)

  
  sequelize
    .sync({ force: sync })
    .then(() => {
      console.log("tables created successfully!");
    })
    .catch((error) => {
      console.error(error);
    });
}

export async function createAndGetNewRound(
  epoch: bigint,
  price: Number,
  isStart: false,
  game: Game
): Promise<[Round, boolean]> {
  let defaultData = {};

  if (isStart) defaultData = { priceStart: price, GameId: game.id };
  else defaultData = { priceEnd: price, GameId: game.id };

 
  try {
    const [round, created] = await Round.findCreateFind({
      where: { epoch: epoch, GameId: game.id },
      defaults: { defaultData},
    });
    return [round, created];
  } catch (error) {
    console.error(error);
  }
}

export async function createAndGetNewAddress(
  address: string,
  game: Game
): Promise<[Address, boolean]> {
  try {
    const [addrId, created] = await Address.findCreateFind({
      where: { address: address, GameId: game.id },
      defaults: { address: address, GameId: game.id },
    });
    return [addrId, created];
  } catch (error) {
    console.error(error);
  }
}


export async function createAndGetNewGame(
   contractId: string
 ): Promise<[Game, boolean]> {
   try {
     const [gameId, created] = await Game.findCreateFind({
       where: { contractId: contractId },
       defaults: { contractId: contractId },
     });
     return [gameId, created];
   } catch (error) {
     console.error(error);
   }
 }

export async function createAndGetNewParticipation(
  roundId: Round,
  addrId: Address,
  gameId: Game,
  side: boolean,
  amountBid: bigint,
  claimed: boolean,
  claimedByAnyoneTimestamp: bigint
): Promise<[RoundParticipation, boolean]> {
  try {
    const [round, created] = await RoundParticipation.findCreateFind({
      where: { RoundId: roundId.id, AddressId: addrId.id, GameId: gameId.id },
      defaults: {
        RoundId: roundId.id,
        AddressId: addrId.id,
        GameId: gameId.id,
        side: side,
        amountBid: amountBid,
        claimed: claimed,
        claimedByAnyoneTimestamp: claimedByAnyoneTimestamp,
      },
    });

    return [round, created];
  } catch (error) {
    console.error(error);
  }
}

export function connect(filePath: string) {
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: filePath,
    retry: {
      max: 50,
    },
    logging: false,
  });

  initDb(sequelize, false);

  return sequelize;
}

/*

-- Round table
CREATE TABLE Round (
    round_id INT PRIMARY KEY,
    epoch BIGINT NOT NULL,
    priceEnd DECIMAL(10, 2) NOT NULL,
    priceStart DECIMAL(10, 2) NOT NULL
);

-- Address table
CREATE TABLE Address (
    address_id INT PRIMARY KEY,
    address VARCHAR(255) NOT NULL
);

-- Join table for Round and Address
CREATE TABLE Round_Address (
    round_id INT,
    address_id INT,
    PRIMARY KEY (round_id, address_id),
    FOREIGN KEY (round_id) REFERENCES Round(round_id),
    FOREIGN KEY (address_id) REFERENCES Address(address_id)
); */
