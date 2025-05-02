import axios from "axios";
import express, { Request, Response } from "express";
import { hisDB } from "./config/db";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;
// user api key ----------------------------------------------------
const baseUrl = "https://canceranywhere.com/caw-gateway-production/";
const username = process.env.API_USERNAME;
const password = process.env.API_PASSWORD;
const credentials = `${username}:${password}`;
const encodedCredentials = Buffer.from(credentials).toString("base64");
const authorizationHeader = `Basic ${encodedCredentials}`;
// end user api key ------------------------------------------------

const taskPateint = cron.schedule(
  "25 23 * * *",
  () => {
    console.log("start patient !");
    cronuploadPateint();
  },
  {
    scheduled: true,
    timezone: "Asia/Bangkok",
  }
);
const taskCancer = cron.schedule(
  "30 23 * * *",
  () => {
    console.log("start cancer !");
    cronUploadCancer();
  },
  {
    scheduled: true,
    timezone: "Asia/Bangkok",
  }
);
taskPateint.start();
taskCancer.start();

const cronuploadPateint = async () => {
  const patient = await getPatientTcb();
  if (patient) {
    await Promise.all(
      patient.map(async (val: any) => {
        const send = await sendPatientToApi(val);
        console.log(send.data);
      })
    );
    console.log("10");
    return 1;
  } else {
    return 0;
  }
};

const cronUploadCancer = async () => {
  const cancer = await getCancerTcb();
  if (cancer) {
    await Promise.all(
      cancer.map(async (val: any) => {
        const send = await sendCancerToApi(val);
        console.log(send.data);
      })
    );
    console.log("10");
    return 1;
  } else {
    return 0;
  }
};

//vw_patient_tcb
const getPatientTcb = async () => {
  await hisDB.raw("SET NAMES utf8");
  return hisDB.select("*").from("vw_patient_tcb");
};
//vw_cancer_tcb
const getCancerTcb = async () => {
  await hisDB.raw('SET NAMES utf8')
  return hisDB.select("*").from("vw_cancer_tcb");
};

//send data to tcb api
const sendPatientToApi = async (params: any) => {
  return axios.post(baseUrl + `patient`, params, {
    headers: { Authorization: authorizationHeader },
  });
};

const sendCancerToApi = async (params: any) => {
  return axios.post(baseUrl + `cancer`, params, {
    headers: { Authorization: authorizationHeader },
  });
};

app.get("/patient", async (req: Request, res: Response) => {
  const patient = await getPatientTcb();
  if (patient) {
    res.status(200).json({
      message: "success",
      data: patient,
    });
  } else {
    res.status(400).json({
      message: "fail",
      data: "no data",
    });
  }
});
app.get("/cancer", async (req: Request, res: Response) => {
  const cancer = await getCancerTcb();
  if (cancer) {
    res.status(200).json({
      message: "success",
      data: cancer,
    });
  } else {
    res.status(400).json({
      message: "fail",
      data: "no data",
    });
  }
});

app.get("/UploadPatient", async (req: Request, res: Response) => {
  const patient: any = await getPatientTcb();
  if (patient) {
    await Promise.all(
      patient.map(async (val: any) => {
        const send = await sendPatientToApi(val);
        if (send.data.status) {
          val.upload = "✅";
        }
      })
    );
    res.status(200).json({
      message: "success",
      data: patient,
    });
  } else {
    res.status(400).json({
      message: "fail",
      data: "no data",
    });
  }
});

app.get("/UploadCancer", async (req: Request, res: Response) => {
  const cancer = await getCancerTcb();
  if (cancer) {
    await Promise.all(cancer.map(async(val: any) => {
      let send = await sendCancerToApi(val)
      if (send.data.status) {
        val.upload = "✅";
      }
    }));
    res.status(200).json({
      message: "success",
      data: "Uploaded Cancer",
    });
  } else {
    res.status(400).json({
      message: "fail",
      data: "no data",
    });
  }
});

async function testConnection() {
  try {
    const result = await hisDB.raw("SELECT 1+1 AS result");
    console.log("✅ Database connected:", result);
    if (result) {
      return "✅ Database connected";
    }
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    return `❌ Database connection failed: ${error.message}`;
  }
}

app.get("/test", async (req: Request, res: Response) => {
  const status = await testConnection();
  res.status(200).json({
    message: "success",
    data: status,
  });
});

app.get("/testSendPatient", async (req: Request, res: Response) => {
  const data: any = [
    {
      cid: "9-1001-00000-00-5",
      hn: "90003",
      title_code: "1",
      name: "Cacner3",
      last_name: "API3",
      birth_date: "19841130",
      sex_code: "1",
      nationality_code: "1",
      address_no: "บ้านเลขที่ 10",
      address_moo: "หมู่ 10",
      area_code: "100000",
      permanent_address_no: "บ้านเลขที่ 1",
      permanent_address_moo: "หมู่ 1",
      permanent_area_code: "100202",
      telephone_1: "1234567890",
    },
    {
      cid: "9-1001-00000-00-4",
      hn: "90001",
      title_code: "1",
      name: "Cacner3",
      last_name: "API3",
      birth_date: "19841130",
      sex_code: "1",
      nationality_code: "1",
      address_no: "บ้านเลขที่ 10",
      address_moo: "หมู่ 10",
      area_code: "100000",
      permanent_address_no: "บ้านเลขที่ 1",
      permanent_address_moo: "หมู่ 1",
      permanent_area_code: "100202",
      telephone_1: "1234567890",
    },
  ];

  console.log(username, password)
  await Promise.all(
    data.map(async (val: any) => {
      const send: any = await sendPatientToApi(val);
      console.log(send.data);
      if (send.data.status) {
        val.upload = "✅";
      } else {
        val.upload = "❌";
      }
    })
  );

  res.status(200).json({
    message: "success",
    data: data,
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
