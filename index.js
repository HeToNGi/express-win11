const express = require('express')
const app = express();
const port = 8080;
const cors = require('cors');
const axios = require('axios'); // 用于发起 HTTP 请求


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

app.get('/news', (req, res) => {
  res.send({
    code: 0,
    message: '请求成功',
    data: [],
  });
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
      current: 'temperature_2m,weathercode,pressure_msl,windspeed_10m,precipitation', // 当前天气
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
      precipitation_probability: '20%', // 降水概率
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
        future_weather: dailyData
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

let access_token = '24.d3299a28bf7b7c79bd30dcf0ccbdd60b.2592000.1711816210.282335-41731833';
// let access_token = '24.4cdd94cd61a959652b52538642ee3d1d.2592000.1700815691.282335-41731833';
app.post('/wenxinworkshop', (req, res) => {
});

const titleRegex = /<title>(.*?)<\/title>/;
const iconRegex = /<link[^>]*(rel=["']icon["']|rel=["']shortcut icon["'])[^>]*href=["']([^"']+)["']/g;
app.get('/get_title_icon', (req, res) => {
  res.send({code: 0, message: '请求成功', data: ''});
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
    avatar_img: 'http://localhost:8080/avatar_img/10287029114.jpg',
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



app.listen(port, () => {
  console.log(`正在监听${port}端口`);
})