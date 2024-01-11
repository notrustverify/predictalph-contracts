import { Sequelize, Model, DataTypes } from "sequelize";

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
}


export function initDb(sequelize: Sequelize) {
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
        unique: true,
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
        unique: true,
      },
      priceEnd: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0 },
      priceStart: DataTypes.NUMBER,
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
      upBid: DataTypes.BOOLEAN,
      amountBid: DataTypes.BIGINT,
      claimed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "RoundParticipation",
    }
  );

  Address.belongsToMany(Round, { through: RoundParticipation });
  Round.belongsToMany(Address, { through: RoundParticipation });

  sequelize
    .sync()
    .then(() => {
      console.log("tables created successfully!");
    })
    .catch((error) => {
      console.error("Unable to create table : ", error);
    });
}

export function connect(filePath: string) {
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: filePath,
    retry: {
      max: 20,
    },
    logging: console.log,
  });

  initDb(sequelize);

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
