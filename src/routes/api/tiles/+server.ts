import { TileTypeModel } from '$lib/models';
import { offlineData } from '$lib/db';
import * as dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

// const MOTR_API_KEY = process.env.MOTR_API_KEY;
// const MOTR_APP_ID = process.env.MOTR_APP_ID;

dotenv.config();

const env = process.env['ENVIRONMENT'];

export const GET = async () => {
  let resArray: any = [];

  console.log('GET GET GET');
  console.log(env);

  const getAllRowsFromTable = async (table: any, returnRequest: boolean | null = false) => {
    const action = 'Find';

    const properties = {
      Locale: 'en-US',
      Location: '47.623098, -122.330184',
      Timezone: 'Pacific Standard Time'
    };

    const body = {
      Action: action,
      Properties: properties,
      Rows: []
    };
    const payload = JSON.stringify(body);

    // Values universal to AppSheet API calls
    const url =
      'https://api.appsheet.com/api/v2/apps/0eab250b-3a5f-4c12-a374-5f611bbfec7f/tables/capacities/Action';
    // const url =
    //   'https://api.appsheet.com/api/v2/apps/' +
    //   MOTR_APP_ID +
    //   '/tables/' +
    //   table +
    //   '/Action?applicationAccessKey=V2-IO8HO-FFh3o-U1pll-Of2RY-c7S6T-APSFq-Lli5g-Re3Yw';

    const method = 'post';

    const headers = {
      'Content-Type': 'application/json',
      applicationAccessKey: 'V2-IO8HO-FFh3o-U1pll-Of2RY-c7S6T-APSFq-Lli5g-Re3Yw'
    };

    const params = {
      method: method,
      contentType: 'application/json',
      headers: headers,
      payload: payload,
      muteHttpExceptions: true
    };

    // if (returnRequest) {
    //   return returnRequest;
    // }

    try {
      const request = new Request(url, params);
      const response = await fetch(request);
      const data = await response.json();
      const body = await data.body;
      console.log(url);
      console.log(request);
      console.log(data);

      console.log(data);
      return body;
      //   const response = await fetch(url, params);
      //   console.log(response);
      //   // get the body and the json from this response
      //   const data = await response.json();
      //   const body = await data.body;
      //   console.log(body);

      //   return data;
    } catch (err) {
      console.log('err: ');
      console.log(err);
    }
  };

  //   if (env === 'dev') {
  console.log('offline data');

  resArray = offlineData;
  const res = getAllRowsFromTable('panels');
  console.log(res);
  //   }

  //   if (env === 'prod') {
  //     // @ts-ignore
  //     let tiles = await TileTypeModel.find();

  //     resArray = tiles;
  //   }

  return new Response(JSON.stringify(resArray), { status: 200 });
};

export const POST = async ({ request }) => {
  const obj = await request.json();

  const newTileType = new TileTypeModel(obj);

  let res = await newTileType.save();

  return new Response(JSON.stringify(res), { status: 200 });
};

export const PATCH = async ({ request }) => {
  const obj = await request.json();

  const objIDRemoved = { ...obj };
  delete objIDRemoved._id;

  const res = await TileTypeModel.updateOne({ _id: new ObjectId(obj._id) }, { $set: objIDRemoved });

  return new Response(JSON.stringify(res), { status: 200 });
};
