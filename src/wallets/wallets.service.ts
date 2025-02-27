import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
import mongoose, { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { WalletAsset } from './entities/wallet-asset.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletSchema: Model<Wallet>,

    @InjectModel(WalletAsset.name)
    private walletAssetSchema: Model<WalletAsset>,

    @InjectConnection()
    private connection: mongoose.Connection,
  ) {}

  create(createWalletDto: CreateWalletDto) {
    return this.walletSchema.create(createWalletDto);
  }

  findAll() {
    return this.walletSchema.find();
  }

  async findOne(id: string) {
    return this.walletSchema.findById(id).populate([
      {
        path: 'assets',
        populate: ['asset'],
      },
    ]);
  }

  async createWalletAsset(data: {
    walletId: string;
    assetId: string;
    shares: number;
  }) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const docs = await this.walletAssetSchema.create(
        [
          {
            wallet: data.walletId,
            asset: data.assetId,
            shares: data.shares,
          },
        ],
        {
          session,
        },
      );
      const walletAsset = docs[0];
      await this.walletSchema.updateOne(
        { _id: data.walletId },
        { $push: { assets: walletAsset._id } },
        { session },
      );
      await session.commitTransaction();

      return walletAsset;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  update(id: number, updateWalletDto: UpdateWalletDto) {
    return `This action updates a #${id} wallet`;
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
