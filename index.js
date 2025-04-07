const express = require('express')
const app = express();
const port = 8080;
const cors = require('cors');
const Chance = require('chance');
const axios = require('axios'); // 用于发起 HTTP 请求
const fs = require('fs').promises; // 使用 promises 版本的 fs
const path = require('path');
const cheerio = require('cheerio');


// const cookieParser = require("cookie-parser");  
// const bodyParser = require('body-parser');


// 添加 body-parser 中间件
// app.use(bodyParser.json({limit: '10mb'}));
app.use(express.json()) // for parsing application/json
// app.use(cookieParser());
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))


// 启用所有跨域请求
app.use(cors());


// 创建 Chance 实例
const chance = new Chance();


const NEWS_FILE = path.join(__dirname, 'news.json');
// 获取当前日期的函数（只包含年月日）
function getCurrentDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // 返回格式如 "2025-04-03"
}
// 模拟存储的数据
let cachedData = {
  data: null,
  lastUpdated: null
};
// 读取新闻文件
async function readNewsFile() {
  try {
    const data = await fs.readFile(NEWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在或读取失败，返回空对象
    return { data: null, lastUpdated: null };
  }
}

// 写入新闻文件
async function writeNewsFile(data) {
  await fs.writeFile(NEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
}
app.get('/news', async (req, res) => {
  const currentDate = getCurrentDate();
  cachedData = await readNewsFile();
  // 检查缓存数据是否存在且日期是否匹配
  if (cachedData.data && cachedData.lastUpdated === currentDate) {
    // 如果数据存在且是今天的，直接返回缓存数据
    res.send({
      code: 0,
      message: '请求成功',
      data: cachedData.data,
    });
    return;
  }
  // 聚合数据新闻接口
  axios.get('http://v.juhe.cn/toutiao/index?key=c476b36cf79542e809245707aa67c2e9&type=guoji').then(async ({ data }) => {
    const newData = data.result.data;
    // 更新缓存
    cachedData = {
      data: newData,
      lastUpdated: currentDate
    };
    // 将新数据写入文件
    await writeNewsFile(cachedData);
    // 返回新数据
    res.send({
      code: 0,
      message: '请求成功',
      data: newData,
    });
  })
});


// WMO 天气代码到天气图标的映射
const weatherCodeToIcon = {
  0: '☀️',   // 晴天
  1: '⛅',   // 大部晴朗
  2: '⛅',   // 局部多云
  3: '☁️',   // 多云
  45: '🌫️',  // 雾
  48: '🌫️',  // 冻雾
  51: '🌧️',  // 小雨
  53: '🌧️',  // 中雨
  55: '🌧️',  // 大雨
  61: '🌧️',  // 小雨
  63: '🌧️',  // 中雨
  65: '⛈️',  // 大雨
  71: '❄️',  // 小雪
  73: '❄️',  // 中雪
  75: '❄️',  // 大雪
  95: '⛈️',  // 雷雨
  // 可根据需要扩展更多代码
};
app.get('/weather', (req, res) => {
  // Open-Meteo API 请求配置
  const url = 'https://api.open-meteo.com/v1/forecast';
  const params = {
      latitude: 39.9042, // 北京纬度
      longitude: 116.4074, // 北京经度
      current: 'temperature_2m,weathercode,pressure_msl,windspeed_10m,precipitation,precipitation_probability', // 当前天气
      // hourly: 'precipitation_probability',
      daily: 'temperature_2m_max,temperature_2m_min,weathercode', // 每日数据
      forecast_days: 5, // 未来 5 天
      timezone: 'Asia/Shanghai' // 时区
  };

  // 调用 Open-Meteo API
  axios.get(url, { params }).then(({data}) => {
    const weatherData = data;
    // 整理当前天气（带单位）
    const currentWeather = {
      temperature: `${weatherData.current.temperature_2m}°C`, // 温度 (°C)
      weather_code: weatherData.current.weathercode, // 天气代码（无单位）
      weather_icon: weatherCodeToIcon[weatherData.current.weathercode] || '❓', // 天气图标（无单位）
      pressure: `${weatherData.current.pressure_msl}hPa`, // 大气压 (hPa)
      wind_speed: `${weatherData.current.windspeed_10m}km/h`, // 风速 (km/h)
      precipitation: `${weatherData.current.precipitation}mm`, // 降水量 (mm)
      precipitation_probability: `${weatherData.current.precipitation_probability}%`, // 降水概率
    };

    // // 整理未来 5 天每日数据（带单位）
    const dailyData = weatherData.daily.time.map((time, index) => ({
      date: time, // 日期（无单位）
      max_temp: `${weatherData.daily.temperature_2m_max[index]} °C`, // 最高温度 (°C)
      min_temp: `${weatherData.daily.temperature_2m_min[index]} °C`, // 最低温度 (°C)
      weather_code: weatherData.daily.weathercode[index], // 天气代码（无单位）
      weather_icon: weatherCodeToIcon[weatherData.daily.weathercode[index]] || '❓', // 天气图标（无单位）
    }));
    res.send({
      code: 0,
      message: '请求成功',
      data: {
        ...currentWeather,
        future_weather: dailyData,
        info: weatherData,
      }
    });
  }).catch((e) => {
    console.error(e)
  });

});

app.get('/stock_price', (req, res) => {
  res.send({
    code: 0,
    message: '请求成功',
    data: [],
  });
});

// let access_token = '24.d3299a28bf7b7c79bd30dcf0ccbdd60b.2592000.1711816210.282335-41731833';
// let access_token = '24.4cdd94cd61a959652b52538642ee3d1d.2592000.1700815691.282335-41731833';
// bce-v3/ALTAK-RBhIqn9HNvnL0qCojnQyp/38a8fb79d980765322e881f1de6a80caaddf37fb
app.post('/wenxinworkshop', (req, res) => {
  const { messages } = req.body;
  const options = {
    'method': 'POST',
    'url': 'https://qianfan.baidubce.com/v2/chat/completions',
    'headers': {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer bce-v3/ALTAK-RBhIqn9HNvnL0qCojnQyp/38a8fb79d980765322e881f1de6a80caaddf37fb',
            'appid': 'app-Ba3oKfcM'
    },
    data: JSON.stringify({
      "model": "ernie-x1-32k-preview",
      "messages": messages,
      "web_search": {
        "enable": false,
        "enable_citation": false,
        "enable_trace": false
      }
    }),
  }
  axios(options)
  .then(response => {
    const resultMessage = response.data.choices[0].message.content
    res.send({code: 0, message: '请求成功', data: {result: resultMessage || '抱歉，可以把问题描述的在完整一些么'}});
  })
  .catch(error => {
    res.send({code: 0, message: '请求成功', data: {result: '服务器忙请稍后再试'}});
  })
});

const titleRegex = /<title>(.*?)<\/title>/;
const iconRegex = /<link[^>]*(rel=["']icon["']|rel=["']shortcut icon["'])[^>]*href=["']([^"']+)["']/g;
app.get('/get_title_icon', (req, res) => {
  const url = req.query.src; // 从查询参数获取目标 URL
  axios.get(url).then(response => {
    const $ = cheerio.load(response.data);
    const title = $('title').text();
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
    // 如果 favicon 是相对路径，转为绝对路径
    const faviconUrl = favicon ? new URL(favicon, url).href : null;
    res.send({code: 0, message: '请求成功', data: {
      title,
      favicon: faviconUrl,
    }});
  });
  
});

// 登录window11

// 查询window11用户 win11_user_name win11_avatar_img win11_telephone_number
const queryWin11User = (req, callback) => {}

function generatePhoneNumber() {
  var phoneNumber = "1";
  for (var i = 0; i < 10; i++) {
    phoneNumber += Math.floor(Math.random() * 10);
  }
  return phoneNumber;
}


// 登录请求 如果存在直接登录，如果不存就直接注册
app.post('/win11_login', (req, res) => {
  res.send({code: 0, message: '登录成功', data: {
    user_name: '李白',
    avatar_img: 'http://154.8.175.183:8080/avatar_img/10287029114.jpg',
    telephone_number: '15581740744',
  }})
});

app.post('/change_avatar_img', (req, res) => {
  const { user_name, avatar_img, telephone_number } = req.body
  res.send({code: 0, message: '修改成功', data: {
    user_name: user_name,
    avatar_img: '',
    telephone_number: telephone_number,
  }})
});

app.get('/avatar_of_telephone_number', (req, res) => {
  const { telephone_number } = req.query;
  res.send({code: 0, message: '请求成功', data: {}});
});
app.get('/userinfo_of_teleorname', (req, res) => {
  const { telephone_number, user_name } = req.query;
  res.send({code: 0, message: '请求成功', data: {}});
})


app.post('/add_contact', (req, res) => {
  const { user_name, avatar_img, telephone_number, contact_name, remarks } = req.body
  res.send({code: 0, message: '添加成功', data: {}});
});

app.get('/contacts', (req, res) => {
  const { user_name } = req.query;
  res.send({code: 0, message: '获取成功', data: []});
});

app.post('/add_callrecord', (req, res) => {
  const { caller, receiver, start_time, duration, connected } = req.body
  res.send({code: 0, message: '添加成功', data: {}});
});

app.get('/call_record', (req, res) => {
  const { telephone_number } = req.query
  res.send({code: 0, message: '获取成功', data: []});
});

app.get('/store_slider', (req, res) => {
  const { type } = req.query
  res.send({code: 0, message: '获取成功', data: {}});
})

app.get('/store_apps', (req, res) => {
  const { type } = req.query;
  res.send({code: 0, message: '获取成功', data: {}});
})
app.get('/store_games', (req, res) => {
  const { type } = req.query;
  res.send({code: 0, message: '获取成功', data: []});
})
app.get('/store_movies', (req, res) => {
  const { type } = req.query;
  res.send({code: 0, message: '获取成功', data: []});
})

const mateImgUrlList = [
  '/images/animals1.jpg',
  '/images/animals2.jpg',
  '/images/animals3.jpg',
  '/images/normal1.jpg',
  '/images/normal2.jpg',
  '/images/normal3.jpg',
  '/images/normal4.jpg',
  '/images/normal5.jpg',
]
const mateImgUrlMap = {
  0: [176, 263],
  1: [176, 263],
  2: [176, 132],
  3: [176, 263],
  4: [176, 263],
  5: [176, 219],
  6: [176, 132],
  7: [176, 132],
}
// 生成模拟数据的函数
const generateMockData1 = (count) => {
  return Array.from({ length: count }, (_, index) => {
    const imgrci = chance.integer({ min: 3, max: 7 });

    return {
      id: index + 1,
      title: chance.sentence({ words: 5 }), // 随机生成 5 个词的标题
      imageUrl: mateImgUrlList[imgrci], 
      imgWith: mateImgUrlMap[imgrci][0],
      imgHeight: index%5 === 0 ? 312 : mateImgUrlMap[imgrci][1],
      type: index % 5 === 0 ? 'video' : 'img',
      videoUrl: index % 5 === 0 ? '/101942_1743580786.mp4' : '',
      user: {
        id: chance.integer({ min: 1, max: 1000 }), // 随机用户 ID
        username: chance.name(), // 随机用户名
        avatar: mateImgUrlList[chance.integer({ min: 0, max: 4 })], // 随机头像
      },
    }
  });
};
const generateMockData2 = (count) => {
  return Array.from({ length: count }, (_, index) => {
    const imgrci = chance.integer({ min: 0, max: 2 });
    return {
      id: index + 1,
      title: chance.sentence({ words: 1 }), // 随机生成 5 个词的标题
      imageUrl: mateImgUrlList[imgrci], 
      imgWith: mateImgUrlMap[imgrci][0],
      imgHeight: index%5 === 0 ? 285 : mateImgUrlMap[imgrci][1],
      type: index % 5 === 0 ? 'video' : 'img',
      videoUrl: index % 5 === 0 ? '/100721_1743403922.mp4' : '',
      user: {
        id: chance.integer({ min: 1, max: 1000 }), // 随机用户 ID
        username: chance.name(), // 随机用户名
        avatar: mateImgUrlList[chance.integer({ min: 0, max: 4 })], // 随机头像
      },
    }
  });
}

const mockMateData1 = generateMockData1(100);
const mockMateData2 = generateMockData2(100);
app.get('/mateapp', (req, res) => {
  const page = parseInt(req.query.page) || 1; // 当前页码
  const limit = parseInt(req.query.limit) || 10; // 每页数量
  const type = req.query.type || '';
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const mockMateData = type === 'normal' ? mockMateData1 : mockMateData2

  const totalItems = mockMateData.length;
  const totalPages = Math.ceil(totalItems / limit);

  // 检查分页范围
  if (startIndex >= totalItems) {
    res.send({code: 0, message: '获取成功', data: {
      items: [],
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: totalItems,
        totalPages: totalPages,
      },
    }});
    return;
  }

  // 分页数据
  const paginatedData = mockMateData.slice(startIndex, endIndex);
  res.send({code: 0, message: '获取成功', data: {
    items: paginatedData,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalItems: totalItems,
      totalPages: totalPages,
    },
  }});
})


app.listen(port, () => {
  console.log(`正在监听${port}端口`);
})