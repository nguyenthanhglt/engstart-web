// Dữ liệu học Tiếng Trung cơ bản (HSK 1 — 4 thanh điệu + 6 chủ đề / 60 từ thiết yếu)
const ZH_TONES = [
  { num: 1, mark: "ā (Thanh 1)", sample: "妈", pinyin: "mā", meaning: "mẹ", desc: "Đọc cao và kéo ngang đều, không lên không xuống (giống thanh ngang tiếng Việt nhưng cao hơn)." },
  { num: 2, mark: "á (Thanh 2)", sample: "麻", pinyin: "má", meaning: "cây gai / tê", desc: "Đọc đi lên nhanh từ thấp lên cao (gần giống dấu sắc nhưng mềm hơn)." },
  { num: 3, mark: "ǎ (Thanh 3)", sample: "马", pinyin: "mǎ", meaning: "con ngựa", desc: "Hạ giọng trầm xuống rồi uốn nhẹ lên (gần giống dấu hỏi tiếng Việt)." },
  { num: 4, mark: "à (Thanh 4)", sample: "骂", pinyin: "mà", meaning: "mắng", desc: "Đọc dứt khoát từ cao rơi mạnh xuống thấp, rất gọn và chắc." }
];

const ZH_TOPICS = [
  {
    id: "zh_greet", num: "01", title: "Chào hỏi & Lễ phép", desc: "Những câu chào, cảm ơn, xin lỗi cơ bản nhất khi mới học tiếng Trung.",
    words: [
      { id: "zh1", hanzi: "你好", pinyin: "nǐ hǎo", vi: "xin chào", exZh: "你好！很高兴认识你。", exPy: "Nǐ hǎo! Hěn gāoxìng rènshi nǐ.", exVi: "Xin chào! Rất vui được quen bạn." },
      { id: "zh2", hanzi: "谢谢", pinyin: "xièxie", vi: "cảm ơn", exZh: "谢谢你的帮助。", exPy: "Xièxie nǐ de bāngzhù.", exVi: "Cảm ơn sự giúp đỡ của bạn." },
      { id: "zh3", hanzi: "不客气", pinyin: "bú kèqi", vi: "không có gì", exZh: "不客气！", exPy: "Bú kèqi!", exVi: "Không có gì đâu!" },
      { id: "zh4", hanzi: "对不起", pinyin: "duìbuqǐ", vi: "xin lỗi", exZh: "对不起，我来晚了。", exPy: "Duìbuqǐ, wǒ lái wǎn le.", exVi: "Xin lỗi, tôi đến muộn rồi." },
      { id: "zh5", hanzi: "没关系", pinyin: "méi guānxi", vi: "không sao đâu", exZh: "没关系，慢慢来。", exPy: "Méi guānxi, mànman lái.", exVi: "Không sao đâu, cứ từ từ." },
      { id: "zh6", hanzi: "再见", pinyin: "zàijiàn", vi: "tạm biệt", exZh: "再见，明天见！", exPy: "Zàijiàn, míngtiān jiàn!", exVi: "Tạm biệt, hẹn gặp lại ngày mai!" },
      { id: "zh7", hanzi: "请", pinyin: "qǐng", vi: "mời, làm ơn", exZh: "请进，请坐！", exPy: "Qǐng jìn, qǐng zuò!", exVi: "Mời vào, mời ngồi!" },
      { id: "zh8", hanzi: "是", pinyin: "shì", vi: "là, đúng", exZh: "我是越南人。", exPy: "Wǒ shì Yuènán rén.", exVi: "Tôi là người Việt Nam." },
      { id: "zh9", hanzi: "我", pinyin: "wǒ", vi: "tôi, mình", exZh: "我喜欢学中文。", exPy: "Wǒ xǐhuan xué Zhōngwén.", exVi: "Tôi thích học tiếng Trung." },
      { id: "zh10", hanzi: "你", pinyin: "nǐ", vi: "bạn, cậu", exZh: "你好吗？", exPy: "Nǐ hǎo ma?", exVi: "Bạn có khỏe không?" }
    ]
  },
  {
    id: "zh_num", num: "02", title: "Số đếm 1 – 10", desc: "Học đếm từ 1 đến 10 để hỏi giá tiền, đọc số điện thoại và giờ giấc.",
    words: [
      { id: "zh11", hanzi: "一", pinyin: "yī", vi: "số 1", exZh: "一杯咖啡。", exPy: "Yì bēi kāfēi.", exVi: "Một ly cà phê." },
      { id: "zh12", hanzi: "二", pinyin: "èr", vi: "số 2", exZh: "一、二、三。", exPy: "Yī, èr, sān.", exVi: "Một, hai, ba." },
      { id: "zh13", hanzi: "三", pinyin: "sān", vi: "số 3", exZh: "三个人。", exPy: "Sān gè rén.", exVi: "Ba người." },
      { id: "zh14", hanzi: "四", pinyin: "sì", vi: "số 4", exZh: "四点钟。", exPy: "Sì diǎn zhōng.", exVi: "Bốn giờ đúng." },
      { id: "zh15", hanzi: "五", pinyin: "wǔ", vi: "số 5", exZh: "五块钱。", exPy: "Wǔ kuài qián.", exVi: "Năm tệ." },
      { id: "zh16", hanzi: "六", pinyin: "liù", vi: "số 6", exZh: "星期六。", exPy: "Xīngqīliù.", exVi: "Thứ Bảy." },
      { id: "zh17", hanzi: "七", pinyin: "qī", vi: "số 7", exZh: "七天。", exPy: "Qī tiān.", exVi: "Bảy ngày." },
      { id: "zh18", hanzi: "八", pinyin: "bā", vi: "số 8", exZh: "八点上班。", exPy: "Bā diǎn shàngbān.", exVi: "Tám giờ đi làm." },
      { id: "zh19", hanzi: "九", pinyin: "jiǔ", vi: "số 9", exZh: "九月。", exPy: "Jiǔ yuè.", exVi: "Tháng Chín." },
      { id: "zh20", hanzi: "十", pinyin: "shí", vi: "số 10", exZh: "十分钟。", exPy: "Shí fēnzhōng.", exVi: "Mười phút." }
    ]
  },
  {
    id: "zh_family", num: "03", title: "Gia đình & Con người", desc: "Giới thiệu người thân, bạn bè, thầy cô và nghề nghiệp cơ bản.",
    words: [
      { id: "zh21", hanzi: "家", pinyin: "jiā", vi: "nhà, gia đình", exZh: "我爱我的家。", exPy: "Wǒ ài wǒ de jiā.", exVi: "Tôi yêu gia đình của tôi." },
      { id: "zh22", hanzi: "爸爸", pinyin: "bàba", vi: "bố, ba", exZh: "这是我爸爸。", exPy: "Zhè shì wǒ bàba.", exVi: "Đây là bố của tôi." },
      { id: "zh23", hanzi: "妈妈", pinyin: "māma", vi: "mẹ, má", exZh: "妈妈做饭很好吃。", exPy: "Māma zuòfàn hěn hǎochī.", exVi: "Mẹ nấu ăn rất ngon." },
      { id: "zh24", hanzi: "朋友", pinyin: "péngyou", vi: "bạn bè", exZh: "她是我的好朋友。", exPy: "Tā shì wǒ de hǎo péngyou.", exVi: "Cô ấy là bạn thân của tôi." },
      { id: "zh25", hanzi: "老师", pinyin: "lǎoshī", vi: "giáo viên", exZh: "老师好！", exPy: "Lǎoshī hǎo!", exVi: "Em chào thầy/cô ạ!" },
      { id: "zh26", hanzi: "学生", pinyin: "xuésheng", vi: "học sinh, sinh viên", exZh: "我是学生。", exPy: "Wǒ shì xuésheng.", exVi: "Tôi là học sinh." },
      { id: "zh27", hanzi: "医生", pinyin: "yīshēng", vi: "bác sĩ", exZh: "我姐姐是医生。", exPy: "Wǒ jiějie shì yīshēng.", exVi: "Chị gái tôi là bác sĩ." },
      { id: "zh28", hanzi: "人", pinyin: "rén", vi: "người", exZh: "这里有很多人。", exPy: "Zhèlǐ yǒu hěn duō rén.", exVi: "Ở đây có rất nhiều người." },
      { id: "zh29", hanzi: "哥哥", pinyin: "gēge", vi: "anh trai", exZh: "我哥哥很帅。", exPy: "Wǒ gēge hěn shuài.", exVi: "Anh trai tôi rất đẹp trai." },
      { id: "zh30", hanzi: "妹妹", pinyin: "mèimei", vi: "em gái", exZh: "我妹妹很可爱。", exPy: "Wǒ mèimei hěn kě'ài.", exVi: "Em gái tôi rất dễ thương." }
    ]
  },
  {
    id: "zh_food", num: "04", title: "Ăn uống & Gọi món", desc: "Từ vựng gọi đồ uống, món ăn quen thuộc và khen món ăn ngon.",
    words: [
      { id: "zh31", hanzi: "水", pinyin: "shuǐ", vi: "nước uống", exZh: "请给我一杯水。", exPy: "Qǐng gěi wǒ yì bēi shuǐ.", exVi: "Làm ơn cho tôi một ly nước." },
      { id: "zh32", hanzi: "茶", pinyin: "chá", vi: "trà", exZh: "你喜欢喝茶吗？", exPy: "Nǐ xǐhuan hē chá ma?", exVi: "Bạn có thích uống trà không?" },
      { id: "zh33", hanzi: "咖啡", pinyin: "kāfēi", vi: "cà phê", exZh: "我每天早上喝咖啡。", exPy: "Wǒ měitiān zǎoshang hē kāfēi.", exVi: "Mỗi sáng tôi đều uống cà phê." },
      { id: "zh34", hanzi: "米饭", pinyin: "mǐfàn", vi: "cơm", exZh: "我要一碗米饭。", exPy: "Wǒ yào yì wǎn mǐfàn.", exVi: "Cho tôi một bát cơm." },
      { id: "zh35", hanzi: "面条", pinyin: "miàntiáo", vi: "mì sợi", exZh: "这碗面条很好吃。", exPy: "Zhè wǎn miàntiáo hěn hǎochī.", exVi: "Bát mì này rất ngon." },
      { id: "zh36", hanzi: "苹果", pinyin: "píngguǒ", vi: "quả táo", exZh: "这个苹果很甜。", exPy: "Zhège píngguǒ hěn tián.", exVi: "Quả táo này rất ngọt." },
      { id: "zh37", hanzi: "好吃", pinyin: "hǎochī", vi: "ngon miệng", exZh: "越南河粉很好吃！", exPy: "Yuènán héfěn hěn hǎochī!", exVi: "Phở Việt Nam rất ngon!" },
      { id: "zh38", hanzi: "吃", pinyin: "chī", vi: "ăn", exZh: "你吃饭了吗？", exPy: "Nǐ chīfàn le ma?", exVi: "Bạn đã ăn cơm chưa?" },
      { id: "zh39", hanzi: "喝", pinyin: "hē", vi: "uống", exZh: "你想喝什么？", exPy: "Nǐ xiǎng hē shénme?", exVi: "Bạn muốn uống gì?" },
      { id: "zh40", hanzi: "菜", pinyin: "cài", vi: "món ăn / rau", exZh: "我们点三个菜吧。", exPy: "Wǒmen diǎn sān gè cài ba.", exVi: "Chúng ta gọi ba món nhé." }
    ]
  },
  {
    id: "zh_shop", num: "05", title: "Mua sắm & Hỏi giá", desc: "Mẫu câu đi chợ, hỏi giá bao nhiêu tiền và chọn đồ đắt hay rẻ.",
    words: [
      { id: "zh41", hanzi: "钱", pinyin: "qián", vi: "tiền", exZh: "我有钱。", exPy: "Wǒ yǒu qián.", exVi: "Tôi có tiền." },
      { id: "zh42", hanzi: "多少钱", pinyin: "duōshao qián", vi: "bao nhiêu tiền?", exZh: "这个多少钱？", exPy: "Zhège duōshao qián?", exVi: "Cái này bao nhiêu tiền?" },
      { id: "zh43", hanzi: "买", pinyin: "mǎi", vi: "mua", exZh: "我想买一件衣服。", exPy: "Wǒ xiǎng mǎi yí jiàn yīfu.", exVi: "Tôi muốn mua một chiếc áo." },
      { id: "zh44", hanzi: "贵", pinyin: "guì", vi: "đắt tiền", exZh: "太贵了！", exPy: "Tài guì le!", exVi: "Đắt quá!" },
      { id: "zh45", hanzi: "便宜", pinyin: "piányi", vi: "rẻ", exZh: "可以便宜一点吗？", exPy: "Kěyǐ piányi yìdiǎn ma?", exVi: "Có thể giảm giá một chút không?" },
      { id: "zh46", hanzi: "衣服", pinyin: "yīfu", vi: "quần áo", exZh: "这件衣服很好看。", exPy: "Zhè jiàn yīfu hěn hǎokàn.", exVi: "Chiếc áo này rất đẹp." },
      { id: "zh47", hanzi: "商店", pinyin: "shāngdiàn", vi: "cửa hàng", exZh: "我去商店买东西。", exPy: "Wǒ qù shāngdiàn mǎi dōngxi.", exVi: "Tôi đi cửa hàng mua đồ." },
      { id: "zh48", hanzi: "大", pinyin: "dà", vi: "to, lớn", exZh: "有大一点的吗？", exPy: "Yǒu dà yìdiǎn de ma?", exVi: "Có cỡ lớn hơn chút không?" },
      { id: "zh49", hanzi: "小", pinyin: "xiǎo", vi: "nhỏ, bé", exZh: "这只小猫很可爱。", exPy: "Zhè zhī xiǎo māo hěn kě'ài.", exVi: "Chú mèo nhỏ này rất dễ thương." },
      { id: "zh50", hanzi: "喜欢", pinyin: "xǐhuan", vi: "thích", exZh: "我很喜欢这个。", exPy: "Wǒ hěn xǐhuan zhège.", exVi: "Tôi rất thích cái này." }
    ]
  },
  {
    id: "zh_daily", num: "06", title: "Thời gian & Giao tiếp hằng ngày", desc: "Nói về hôm nay, ngày mai, thời tiết, công việc và học tiếng Trung.",
    words: [
      { id: "zh51", hanzi: "今天", pinyin: "jīntiān", vi: "hôm nay", exZh: "今天天气很好。", exPy: "Jīntiān tiānqì hěn hǎo.", exVi: "Hôm nay thời tiết rất đẹp." },
      { id: "zh52", hanzi: "明天", pinyin: "míngtiān", vi: "ngày mai", exZh: "明天见！", exPy: "Míngtiān jiàn!", exVi: "Hẹn gặp lại ngày mai!" },
      { id: "zh53", hanzi: "昨天", pinyin: "zuótiān", vi: "hôm qua", exZh: "昨天我很忙。", exPy: "Zuótiān wǒ hěn máng.", exVi: "Hôm qua tôi rất bận." },
      { id: "zh54", hanzi: "现在", pinyin: "xiànzài", vi: "bây giờ", exZh: "现在几点了？", exPy: "Xiànzài jǐ diǎn le?", exVi: "Bây giờ mấy giờ rồi?" },
      { id: "zh55", hanzi: "天气", pinyin: "tiānqì", vi: "thời tiết", exZh: "今天天气很热。", exPy: "Jīntiān tiānqì hěn rè.", exVi: "Hôm nay thời tiết rất nóng." },
      { id: "zh56", hanzi: "去", pinyin: "qù", vi: "đi", exZh: "你想去哪儿？", exPy: "Nǐ xiǎng qù nǎr?", exVi: "Bạn muốn đi đâu?" },
      { id: "zh57", hanzi: "来", pinyin: "lái", vi: "đến", exZh: "欢迎你来越南！", exPy: "Huānyíng nǐ lái Yuènán!", exVi: "Chào mừng bạn đến Việt Nam!" },
      { id: "zh58", hanzi: "工作", pinyin: "gōngzuò", vi: "công việc / làm việc", exZh: "我很喜欢我的工作。", exPy: "Wǒ hěn xǐhuan wǒ de gōngzuò.", exVi: "Tôi rất thích công việc của mình." },
      { id: "zh59", hanzi: "学习", pinyin: "xuéxí", vi: "học tập", exZh: "我每天学习汉语。", exPy: "Wǒ měitiān xuéxí Hànyǔ.", exVi: "Mỗi ngày tôi đều học tiếng Trung." },
      { id: "zh60", hanzi: "汉语", pinyin: "Hànyǔ", vi: "tiếng Trung (Hán ngữ)", exZh: "汉语很有意思。", exPy: "Hànyǔ hěn yǒu yìsi.", exVi: "Tiếng Trung rất thú vị." }
    ]
  }
  ,{
    id: "zh_color_animal", num: "07", title: "Màu sắc & Động vật", desc: "Từ vựng màu sắc và thú cưng dễ nhớ cho cả trẻ em và người mới bắt đầu.",
    words: [
      { id: "zh61", hanzi: "红色", pinyin: "hóngsè", vi: "màu đỏ", exZh: "我喜欢红色。", exPy: "Wǒ xǐhuan hóngsè.", exVi: "Tôi thích màu đỏ." },
      { id: "zh62", hanzi: "蓝色", pinyin: "lánsè", vi: "màu xanh dương", exZh: "天空是蓝色的。", exPy: "Tiānkōng shì lánsè de.", exVi: "Bầu trời có màu xanh dương." },
      { id: "zh63", hanzi: "白色", pinyin: "báisè", vi: "màu trắng", exZh: "这件白衬衫很好看。", exPy: "Zhè jiàn bái chènshān hěn hǎokàn.", exVi: "Chiếc áo sơ mi trắng này rất đẹp." },
      { id: "zh64", hanzi: "黑色", pinyin: "hēisè", vi: "màu đen", exZh: "他有一辆黑色的车。", exPy: "Tā yǒu yí liàng hēisè de chē.", exVi: "Anh ấy có một chiếc xe màu đen." },
      { id: "zh65", hanzi: "黄色", pinyin: "huángsè", vi: "màu vàng", exZh: "香蕉是黄色的。", exPy: "Xiāngjiāo shì huángsè de.", exVi: "Quả chuối có màu vàng." },
      { id: "zh66", hanzi: "猫", pinyin: "māo", vi: "con mèo", exZh: "我家里有一只小猫。", exPy: "Wǒ jiālǐ yǒu yì zhī xiǎo māo.", exVi: "Nhà tôi có một chú mèo nhỏ." },
      { id: "zh67", hanzi: "狗", pinyin: "gǒu", vi: "con chó", exZh: "小狗很聪明。", exPy: "Xiǎo gǒu hěn cōngming.", exVi: "Chú chó con rất thông minh." },
      { id: "zh68", hanzi: "鸟", pinyin: "niǎo", vi: "con chim", exZh: "树上有一只小鸟。", exPy: "Shùshàng yǒu yì zhī xiǎo niǎo.", exVi: "Trên cây có một chú chim nhỏ." },
      { id: "zh69", hanzi: "鱼", pinyin: "yú", vi: "con cá", exZh: "水里有很多鱼。", exPy: "Shuǐlǐ yǒu hěn duō yú.", exVi: "Trong nước có rất nhiều cá." },
      { id: "zh70", hanzi: "兔子", pinyin: "tùzi", vi: "con thỏ", exZh: "小白兔喜欢吃胡萝卜。", exPy: "Xiǎo báitù xǐhuan chī húluóbo.", exVi: "Thỏ trắng nhỏ thích ăn cà rốt." }
    ]
  },
  {
    id: "zh_travel", num: "08", title: "Du lịch & Hỏi đường", desc: "Từ vựng đi máy bay, khách sạn, rẽ trái/phải và gọi xe khi du lịch Trung Quốc.",
    words: [
      { id: "zh71", hanzi: "机场", pinyin: "jīchǎng", vi: "sân bay", exZh: "我去机场接朋友。", exPy: "Wǒ qù jīchǎng jiē péngyou.", exVi: "Tôi ra sân bay đón bạn." },
      { id: "zh72", hanzi: "酒店", pinyin: "jiǔdiàn", vi: "khách sạn", exZh: "我们的酒店很干净。", exPy: "Wǒmen de jiǔdiàn hěn gānjìng.", exVi: "Khách sạn của chúng tôi rất sạch sẽ." },
      { id: "zh73", hanzi: "护照", pinyin: "hùzhào", vi: "hộ chiếu", exZh: "请出示您的护照。", exPy: "Qǐng chūshì nín de hùzhào.", exVi: "Vui lòng xuất trình hộ chiếu của bạn." },
      { id: "zh74", hanzi: "地图", pinyin: "dìtú", vi: "bản đồ", exZh: "我看看手机地图。", exPy: "Wǒ kànkan shǒujī dìtú.", exVi: "Để tôi xem bản đồ trên điện thoại." },
      { id: "zh75", hanzi: "左边", pinyin: "zuǒbiān", vi: "bên trái", exZh: "银行在左边。", exPy: "Yínháng zài zuǒbiān.", exVi: "Ngân hàng ở bên trái." },
      { id: "zh76", hanzi: "右边", pinyin: "yòubiān", vi: "bên phải", exZh: "前面往右边拐。", exPy: "Qiánmiàn wǎng yòubiān guǎi.", exVi: "Phía trước rẽ sang bên phải." },
      { id: "zh77", hanzi: "直走", pinyin: "zhízǒu", vi: "đi thẳng", exZh: "一直走就到了。", exPy: "Yìzhí zǒu jiù dào le.", exVi: "Cứ đi thẳng là tới." },
      { id: "zh78", hanzi: "出租车", pinyin: "chūzūchē", vi: "xe taxi", exZh: "我们坐出租车吧。", exPy: "Wǒmen zuò chūzūchē ba.", exVi: "Chúng ta đi taxi nhé." },
      { id: "zh79", hanzi: "火车", pinyin: "huǒchē", vi: "tàu hỏa", exZh: "坐火车很方便。", exPy: "Zuò huǒchē hěn fāngbiàn.", exVi: "Đi tàu hỏa rất tiện lợi." },
      { id: "zh80", hanzi: "飞机", pinyin: "fēijī", vi: "máy bay", exZh: "飞机下午三点起飞。", exPy: "Fēijī xiàwǔ sān diǎn qǐfēi.", exVi: "Máy bay cất cánh lúc 3 giờ chiều." }
    ]
  },
  {
    id: "zh_health", num: "09", title: "Sức khỏe & Cơ thể", desc: "Cách nói về sức khỏe, cảm giác mệt mỏi, đi bệnh viện và uống thuốc.",
    words: [
      { id: "zh81", hanzi: "身体", pinyin: "shēntǐ", vi: "cơ thể, sức khỏe", exZh: "祝你身体健康！", exPy: "Zhù nǐ shēntǐ jiànkāng!", exVi: "Chúc bạn sức khỏe dồi dào!" },
      { id: "zh82", hanzi: "头", pinyin: "tóu", vi: "cái đầu", exZh: "我有点儿头疼。", exPy: "Wǒ yǒudiǎnr tóuténg.", exVi: "Tôi hơi bị đau đầu." },
      { id: "zh83", hanzi: "眼睛", pinyin: "yǎnjing", vi: "đôi mắt", exZh: "她的眼睛很大。", exPy: "Tā de yǎnjing hěn dà.", exVi: "Đôi mắt cô ấy rất to." },
      { id: "zh84", hanzi: "手", pinyin: "shǒu", vi: "bàn tay", exZh: "吃饭前要洗手。", exPy: "Chīfàn qián yào xǐshǒu.", exVi: "Trước khi ăn phải rửa tay." },
      { id: "zh85", hanzi: "累", pinyin: "lèi", vi: "mệt mỏi", exZh: "今天工作太累了。", exPy: "Jīntiān gōngzuò tài lèi le.", exVi: "Hôm nay làm việc mệt quá." },
      { id: "zh86", hanzi: "生病", pinyin: "shēngbìng", vi: "bị ốm, bị bệnh", exZh: "他生病了，在家休息。", exPy: "Tā shēngbìng le, zài jiā xiūxi.", exVi: "Anh ấy bị ốm nên nghỉ ở nhà." },
      { id: "zh87", hanzi: "医院", pinyin: "yīyuàn", vi: "bệnh viện", exZh: "医院离这里不远。", exPy: "Yīyuàn lí zhèlǐ bù yuǎn.", exVi: "Bệnh viện cách đây không xa." },
      { id: "zh88", hanzi: "药", pinyin: "yào", vi: "thuốc uống", exZh: "记得按时吃药。", exPy: "Jìde ànshí chīyào.", exVi: "Nhớ uống thuốc đúng giờ nhé." },
      { id: "zh89", hanzi: "休息", pinyin: "xiūxi", vi: "nghỉ ngơi", exZh: "你早点休息吧。", exPy: "Nǐ zǎodiǎn xiūxi ba.", exVi: "Bạn nghỉ ngơi sớm đi nhé." },
      { id: "zh90", hanzi: "运动", pinyin: "yùndòng", vi: "tập thể dục, thể thao", exZh: "我每天早上运动。", exPy: "Wǒ měitiān zǎoshang yùndòng.", exVi: "Mỗi sáng tôi đều tập thể dục." }
    ]
  },
  {
    id: "zh_work", num: "10", title: "Công việc & Công sở", desc: "Từ vựng giao tiếp nơi làm việc, công ty, họp hành và đối tác Trung Quốc.",
    words: [
      { id: "zh91", hanzi: "公司", pinyin: "gōngsī", vi: "công ty", exZh: "我在一家大公司工作。", exPy: "Wǒ zài yì jiā dà gōngsī gōngzuò.", exVi: "Tôi làm việc ở một công ty lớn." },
      { id: "zh92", hanzi: "办公室", pinyin: "bàngōngshì", vi: "văn phòng", exZh: "经理在办公室里。", exPy: "Jīnglǐ zài bàngōngshì lǐ.", exVi: "Giám đốc đang ở trong văn phòng." },
      { id: "zh93", hanzi: "老板", pinyin: "lǎobǎn", vi: "ông chủ, sếp", exZh: "老板今天不在。", exPy: "Lǎobǎn jīntiān bú zài.", exVi: "Hôm nay sếp không có ở đây." },
      { id: "zh94", hanzi: "同事", pinyin: "tóngshì", vi: "đồng nghiệp", exZh: "我的同事都很友好。", exPy: "Wǒ de tóngshì dōu hěn yǒuhǎo.", exVi: "Đồng nghiệp của tôi đều rất thân thiện." },
      { id: "zh95", hanzi: "开会", pinyin: "kāihuì", vi: "họp, mở cuộc họp", exZh: "上午十点开会。", exPy: "Shàngwǔ shí diǎn kāihuì.", exVi: "10 giờ sáng có cuộc họp." },
      { id: "zh96", hanzi: "电脑", pinyin: "diànnǎo", vi: "máy tính", exZh: "我用电脑写报告。", exPy: "Wǒ yòng diànnǎo xiě bàogào.", exVi: "Tôi dùng máy tính viết báo cáo." },
      { id: "zh97", hanzi: "手机", pinyin: "shǒujī", vi: "điện thoại di động", exZh: "你的手机号码是多少？", exPy: "Nǐ de shǒujī hàomǎ shì duōshao?", exVi: "Số điện thoại của bạn là gì?" },
      { id: "zh98", hanzi: "忙", pinyin: "máng", vi: "bận rộn", exZh: "最近工作很忙。", exPy: "Zuìjìn gōngzuò hěn máng.", exVi: "Gần đây công việc rất bận." },
      { id: "zh99", hanzi: "帮助", pinyin: "bāngzhù", vi: "giúp đỡ", exZh: "请问可以帮我一下吗？", exPy: "Qǐngwèn kěyǐ bāng wǒ yíxià ma?", exVi: "Xin hỏi có thể giúp tôi một chút không?" },
      { id: "zh100", hanzi: "问题", pinyin: "wèntí", vi: "vấn đề, câu hỏi", exZh: "没问题！", exPy: "Méi wèntí!", exVi: "Không vấn đề gì!" }
    ]
  },
  {
    id: "zh_house", num: "11", title: "Nhà cửa & Đồ vật", desc: "Những đồ dùng quen thuộc hằng ngày trong phòng và trên bàn học.",
    words: [
      { id: "zh101", hanzi: "房间", pinyin: "fángjiān", vi: "căn phòng", exZh: "这个房间很明亮。", exPy: "Zhège fángjiān hěn míngliàng.", exVi: "Căn phòng này rất sáng sủa." },
      { id: "zh102", hanzi: "桌子", pinyin: "zhuōzi", vi: "cái bàn", exZh: "书在桌子上。", exPy: "Shū zài zhuōzi shàng.", exVi: "Quyển sách ở trên bàn." },
      { id: "zh103", hanzi: "椅子", pinyin: "yǐzi", vi: "cái ghế", exZh: "这里有一把椅子。", exPy: "Zhèlǐ yǒu yì bǎ yǐzi.", exVi: "Ở đây có một cái ghế." },
      { id: "zh104", hanzi: "床", pinyin: "chuáng", vi: "cái giường", exZh: "这张床很舒服。", exPy: "Zhè zhāng chuáng hěn shūfu.", exVi: "Chiếc giường này rất êm ái." },
      { id: "zh105", hanzi: "杯子", pinyin: "bēizi", vi: "cái cốc, ly", exZh: "这是我的杯子。", exPy: "Zhè shì wǒ de bēizi.", exVi: "Đây là cái cốc của tôi." },
      { id: "zh106", hanzi: "书", pinyin: "shū", vi: "quyển sách", exZh: "我喜欢看书。", exPy: "Wǒ xǐhuan kànshū.", exVi: "Tôi thích đọc sách." },
      { id: "zh107", hanzi: "笔", pinyin: "bǐ", vi: "cây bút", exZh: "请借我一支笔。", exPy: "Qǐng jiè wǒ yì zhī bǐ.", exVi: "Cho tôi mượn một cây bút nhé." },
      { id: "zh108", hanzi: "包", pinyin: "bāo", vi: "cái túi, cặp sách", exZh: "我的钥匙在包里。", exPy: "Wǒ de yàoshi zài bāo lǐ.", exVi: "Chìa khóa của tôi ở trong túi." },
      { id: "zh109", hanzi: "门", pinyin: "mén", vi: "cánh cửa", exZh: "请关门。", exPy: "Qǐng guānmén.", exVi: "Làm ơn đóng cửa lại." },
      { id: "zh110", hanzi: "窗户", pinyin: "chuānghu", vi: "cửa sổ", exZh: "打开窗户吧。", exPy: "Dǎkāi chuānghu ba.", exVi: "Mở cửa sổ ra nhé." }
    ]
  },
  {
    id: "zh_adj", num: "12", title: "Cảm xúc & Tính từ hay dùng", desc: "Các tính từ cốt lõi giúp bạn diễn đạt cảm xúc và mô tả mọi thứ tự nhiên.",
    words: [
      { id: "zh111", hanzi: "高兴", pinyin: "gāoxìng", vi: "vui vẻ", exZh: "今天我很高兴！", exPy: "Jīntiān wǒ hěn gāoxìng!", exVi: "Hôm nay tôi rất vui!" },
      { id: "zh112", hanzi: "难过", pinyin: "nánguò", vi: "buồn bã", exZh: "别难过了。", exPy: "Bié nánguò le.", exVi: "Đừng buồn nữa nhé." },
      { id: "zh113", hanzi: "漂亮", pinyin: "piàoliang", vi: "xinh đẹp", exZh: "你今天真漂亮！", exPy: "Nǐ jīntiān zhēn piàoliang!", exVi: "Hôm nay bạn thật xinh đẹp!" },
      { id: "zh114", hanzi: "聪明", pinyin: "cōngming", vi: "thông minh", exZh: "这个孩子很聪明。", exPy: "Zhège háizi hěn cōngming.", exVi: "Đứa trẻ này rất thông minh." },
      { id: "zh115", hanzi: "新", pinyin: "xīn", vi: "mới", exZh: "我买了一部新手机。", exPy: "Wǒ mǎi le yí bù xīn shǒujī.", exVi: "Tôi đã mua một chiếc điện thoại mới." },
      { id: "zh116", hanzi: "旧", pinyin: "jiù", vi: "cũ", exZh: "这本旧书很有用。", exPy: "Zhè běn jiù shū hěn yǒuyòng.", exVi: "Quyển sách cũ này rất hữu ích." },
      { id: "zh117", hanzi: "快", pinyin: "kuài", vi: "nhanh", exZh: "时间过得真快！", exPy: "Shíjiān guò de zhēn kuài!", exVi: "Thời gian trôi thật nhanh!" },
      { id: "zh118", hanzi: "慢", pinyin: "màn", vi: "chậm", exZh: "请说慢一点。", exPy: "Qǐng shuō màn yìdiǎn.", exVi: "Làm ơn nói chậm một chút." },
      { id: "zh119", hanzi: "容易", pinyin: "róngyì", vi: "dễ dàng", exZh: "这句话很容易。", exPy: "Zhè jù huà hěn róngyì.", exVi: "Câu này rất dễ." },
      { id: "zh120", hanzi: "重要", pinyin: "zhòngyào", vi: "quan trọng", exZh: "健康最重要。", exPy: "Jiànkāng zuì zhòngyào.", exVi: "Sức khỏe là quan trọng nhất." }
    ]
  }
];

const ZH_DIALOGUES = [
  {
    id: "zhd1", title: "01. Chào hỏi & Làm quen",
    lines: [
      { role: "A", name: "Tiểu Minh", zh: "你好！请问你叫什么名字？", py: "Nǐ hǎo! Qǐngwèn nǐ jiào shénme míngzi?", vi: "Xin chào! Xin hỏi bạn tên là gì?" },
      { role: "B", name: "Bạn", zh: "你好！我叫阿灵。我是越南人。", py: "Nǐ hǎo! Wǒ jiào Ā Líng. Wǒ shì Yuènán rén.", vi: "Xin chào! Mình tên là Linh. Mình là người Việt Nam." },
      { role: "A", name: "Tiểu Minh", zh: "很高兴认识你！你的汉语很好。", py: "Hěn gāoxìng rènshi nǐ! Nǐ de Hànyǔ hěn hǎo.", vi: "Rất vui được quen bạn! Tiếng Trung của bạn tốt quá." },
      { role: "B", name: "Bạn", zh: "谢谢！我正在学习汉语。", py: "Xièxie! Wǒ zhèngzài xuéxí Hànyǔ.", vi: "Cảm ơn! Mình vẫn đang học tiếng Trung thôi." }
    ]
  },
  {
    id: "zhd2", title: "02. Gọi đồ ăn & Thức uống",
    lines: [
      { role: "A", name: "Phục vụ", zh: "欢迎光临！请问想喝点什么？", py: "Huānyíng guānglín! Qǐngwèn xiǎng hē diǎn shénme?", vi: "Chào mừng quý khách! Bạn muốn uống gì ạ?" },
      { role: "B", name: "Bạn", zh: "请给我一杯冰咖啡和一碗面条。", py: "Qǐng gěi wǒ yì bēi bīng kāfēi hé yì wǎn miàntiáo.", vi: "Cho mình một ly cà phê đá và một bát mì nhé." },
      { role: "A", name: "Phục vụ", zh: "好的，请稍等。", py: "Hǎo de, qǐng shāoděng.", vi: "Vâng ạ, vui lòng đợi một lát." },
      { role: "B", name: "Bạn", zh: "谢谢！这个面条真好吃！", py: "Xièxie! Zhège miàntiáo zhēn hǎochī!", vi: "Cảm ơn! Món mì này ngon thật đấy!" }
    ]
  },
  {
    id: "zhd3", title: "03. Mua sắm & Mặc cả",
    lines: [
      { role: "B", name: "Bạn", zh: "老板，这件衣服多少钱？", py: "Lǎobǎn, zhè jiàn yīfu duōshao qián?", vi: "Chủ quán ơi, chiếc áo này bao nhiêu tiền vậy?" },
      { role: "A", name: "Chủ quán", zh: "这件一百块。", py: "Zhè jiàn yìbǎi kuài.", vi: "Chiếc này 100 tệ bạn nhé." },
      { role: "B", name: "Bạn", zh: "太贵了！可以便宜一点吗？", py: "Tài guì le! Kěyǐ piányi yìdiǎn ma?", vi: "Đắt quá! Có thể giảm giá một chút không?" },
      { role: "A", name: "Chủ quán", zh: "好吧，八十块给你。", py: "Hǎo ba, bāshí kuài gěi nǐ.", vi: "Được rồi, để cho bạn 80 tệ nhé." }
    ]
  },
  {
    id: "zhd4", title: "04. Hỏi đường khi đi du lịch",
    lines: [
      { role: "B", name: "Bạn", zh: "请问，去酒店怎么走？", py: "Qǐngwèn, qù jiǔdiàn zěnme zǒu?", vi: "Xin hỏi, đi đến khách sạn đi đường nào ạ?" },
      { role: "A", name: "Người dân", zh: "一直走，然后往右边拐。", py: "Yìzhí zǒu, ránhòu wǎng yòubiān guǎi.", vi: "Cứ đi thẳng, sau đó rẽ sang bên phải." },
      { role: "B", name: "Bạn", zh: "离这里远吗？", py: "Lí zhèlǐ yuǎn ma?", vi: "Cách đây có xa không ạ?" },
      { role: "A", name: "Người dân", zh: "不远，走五分钟就到了。", py: "Bù yuǎn, zǒu wǔ fēnzhōng jiù dào le.", vi: "Không xa đâu, đi bộ 5 phút là tới rồi." }
    ]
  }
];

const EXTRA_ZH_WORDS = [["觉得", "juéde", "động từ", "cảm thấy, cho rằng", "HSK1"], ["知道", "zhīdào", "động từ", "biết", "HSK1"], ["认为", "rènwéi", "động từ", "cho rằng, nhận định", "HSK2"], ["希望", "xīwàng", "động từ", "hy vọng", "HSK2"], ["准备", "zhǔnbèi", "động từ", "chuẩn bị", "HSK2"], ["开始", "kāishǐ", "động từ", "bắt đầu", "HSK2"], ["结束", "jiéshù", "động từ", "kết thúc", "HSK2"], ["告诉", "gàosu", "động từ", "nói cho biết, kể", "HSK2"], ["问", "wèn", "động từ", "hỏi", "HSK2"], ["回答", "huídá", "động từ", "trả lời", "HSK2"], ["明白", "míngbai", "động từ", "hiểu rõ", "HSK2"], ["懂", "dǒng", "động từ", "hiểu", "HSK2"], ["忘记", "wàngjì", "động từ", "quên", "HSK2"], ["记得", "jìde", "động từ", "nhớ", "HSK2"], ["需要", "xūyào", "động từ", "cần", "HSK2"], ["应该", "yīnggāi", "động từ", "nên, cần phải", "HSK2"], ["可以", "kěyǐ", "động từ", "có thể, được phép", "HSK1"], ["会", "huì", "động từ", "biết làm, sẽ", "HSK1"], ["能", "néng", "động từ", "có thể (khả năng)", "HSK1"], ["想", "xiǎng", "động từ", "muốn, nhớ, nghĩ", "HSK1"], ["要", "yào", "động từ", "muốn, cần, phải", "HSK2"], ["给", "gěi", "động từ", "đưa cho, tặng", "HSK2"], ["送", "sòng", "động từ", "tặng, tiễn, giao hàng", "HSK2"], ["找", "zhǎo", "động từ", "tìm kiếm, trả tiền thừa", "HSK2"], ["等", "děng", "động từ", "đợi, chờ", "HSK2"], ["见", "jiàn", "động từ", "gặp mặt", "HSK1"], ["认识", "rènshi", "động từ", "quen biết", "HSK1"], ["介绍", "jièshào", "động từ", "giới thiệu", "HSK2"], ["说话", "shuōhuà", "động từ", "nói chuyện", "HSK1"], ["听", "tīng", "động từ", "nghe", "HSK1"], ["看", "kàn", "động từ", "nhìn, xem, đọc", "HSK1"], ["写", "xiě", "động từ", "viết", "HSK1"], ["读", "dú", "động từ", "đọc thành tiếng", "HSK1"], ["笑", "xiào", "động từ", "cười", "HSK2"], ["哭", "kū", "động từ", "khóc", "HSK2"], ["玩", "wán", "động từ", "chơi đùa", "HSK2"], ["唱歌", "chànggē", "động từ", "hát", "HSK2"], ["跳舞", "tiàowǔ", "động từ", "nhảy múa", "HSK2"], ["游泳", "yóuyǒng", "động từ", "bơi lội", "HSK2"], ["跑步", "pǎobù", "động từ", "chạy bộ", "HSK2"], ["旅游", "lǚyóu", "động từ", "du lịch", "HSK2"], ["参观", "cānguān", "động từ", "tham quan", "HSK3"], ["参加", "cānjiā", "động từ", "tham gia", "HSK3"], ["决定", "juédìng", "động từ", "quyết định", "HSK3"], ["选择", "xuǎnzé", "động từ", "lựa chọn", "HSK3"], ["同意", "tóngyì", "động từ", "đồng ý", "HSK3"], ["相信", "xiāngxìn", "động từ", "tin tưởng", "HSK3"], ["关心", "guānxīn", "động từ", "quan tâm", "HSK3"], ["照顾", "zhàogù", "động từ", "chăm sóc", "HSK3"], ["欢迎", "huānyíng", "động từ", "hoan nghênh, chào đón", "HSK2"], ["早上", "zǎoshang", "danh từ", "buổi sáng", "HSK2"], ["中午", "zhōngwǔ", "danh từ", "buổi trưa", "HSK1"], ["下午", "xiàwǔ", "danh từ", "buổi chiều", "HSK1"], ["晚上", "wǎnshang", "danh từ", "buổi tối", "HSK2"], ["小时", "xiǎoshí", "danh từ", "tiếng đồng hồ", "HSK2"], ["分钟", "fēnzhōng", "danh từ", "phút", "HSK1"], ["星期", "xīngqī", "danh từ", "tuần, thứ", "HSK1"], ["今年", "jīnnián", "danh từ", "năm nay", "HSK2"], ["去年", "qùnián", "danh từ", "năm ngoái", "HSK2"], ["明年", "míngnián", "danh từ", "năm sau", "HSK2"], ["春", "chūn", "danh từ", "mùa xuân", "HSK3"], ["夏", "xià", "danh từ", "mùa hè", "HSK3"], ["秋", "qiū", "danh từ", "mùa thu", "HSK3"], ["冬", "dōng", "danh từ", "mùa đông", "HSK3"], ["太阳", "tàiyáng", "danh từ", "mặt trời", "HSK3"], ["月亮", "yuèliang", "danh từ", "mặt trăng", "HSK3"], ["风", "fēng", "danh từ", "gió", "HSK3"], ["雨", "yǔ", "danh từ", "mưa", "HSK1"], ["雪", "xuě", "danh từ", "tuyết", "HSK2"], ["热", "rè", "tính từ", "nóng", "HSK1"], ["冷", "lěng", "tính từ", "lạnh", "HSK1"], ["远", "yuǎn", "tính từ", "xa", "HSK2"], ["近", "jìn", "tính từ", "gần", "HSK2"], ["长", "cháng", "tính từ", "dài", "HSK2"], ["短", "duǎn", "tính từ", "ngắn", "HSK3"], ["高", "gāo", "tính từ", "cao", "HSK2"], ["矮", "ǎi", "tính từ", "thấp, lùn", "HSK3"], ["多", "duō", "tính từ", "nhiều", "HSK1"], ["少", "shǎo", "tính từ", "ít", "HSK1"], ["对", "duì", "tính từ", "đúng", "HSK2"], ["错", "cuò", "tính từ", "sai", "HSK2"], ["认真", "rènzhēn", "tính từ", "chăm chỉ, nghiêm túc", "HSK3"], ["努力", "nǔlì", "tính từ", "nỗ lực, cố gắng", "HSK3"], ["方便", "fāngbiàn", "tính từ", "tiện lợi", "HSK3"], ["安静", "ānjìng", "tính từ", "yên tĩnh", "HSK3"], ["干净", "gānjìng", "tính từ", "sạch sẽ", "HSK3"], ["舒服", "shūfu", "tính từ", "thoải mái, dễ chịu", "HSK3"], ["紧张", "jǐnzhāng", "tính từ", "hồi hộp, căng thẳng", "HSK3"], ["特别", "tèbié", "trạng từ", "đặc biệt", "HSK3"], ["非常", "fēicháng", "trạng từ", "vô cùng, rất", "HSK2"], ["经常", "jīngcháng", "trạng từ", "thường xuyên", "HSK3"], ["总是", "zǒngshì", "trạng từ", "luôn luôn", "HSK3"], ["已经", "yǐjīng", "trạng từ", "đã rồi", "HSK2"], ["一起", "yìqǐ", "trạng từ", "cùng nhau", "HSK2"], ["马上", "mǎshàng", "trạng từ", "lập tức, ngay", "HSK3"], ["因为", "yīnwèi", "liên từ", "bởi vì", "HSK2"], ["所以", "suǒyǐ", "liên từ", "cho nên", "HSK2"], ["但是", "dànshì", "liên từ", "nhưng mà", "HSK2"], ["如果", "rúguǒ", "liên từ", "nếu như", "HSK3"], ["虽然", "suīrán", "liên từ", "mặc dù", "HSK3"]];

const ZH_GRAMMAR = [
  {
    id: "zhg1", number: "Bài 01", title: "Câu cơ bản Chủ ngữ + Động từ + Tân ngữ",
    summary: "Tiếng Trung có trật tự giống hệt tiếng Anh và tiếng Việt: Ai đó + Làm gì + Cái gì, và ĐỘNG TỪ KHÔNG BAO GIỜ CHIA THEO THÌ.",
    formulas: [
      { label: "Khẳng định", code: "S + Động từ + O  (Ví dụ: 我喝茶 - Tôi uống trà)" },
      { label: "Phủ định", code: "S + 不 (bù) + Động từ  (Ví dụ: 我不喝茶)" }
    ],
    examples: [
      { zh: "我学习汉语。", py: "Wǒ xuéxí Hànyǔ.", vi: "Tôi học tiếng Trung." },
      { zh: "他不喝咖啡。", py: "Tā bù hē kāfēi.", vi: "Anh ấy không uống cà phê." }
    ],
    warning: "Đặc biệt với động từ 有 (yǒu - có), không dùng 不 mà luôn dùng 没 (méi): 我没有钱 (Tôi không có tiền)."
  },
  {
    id: "zhg2", number: "Bài 02", title: "Câu với 是 (shì - là) & 很 (hěn - rất)",
    summary: "Dùng 是 để nối danh từ (Tôi là người Việt Nam). Khi mô tả bằng tính từ (đẹp, vui, bận), người Trung hay thêm 很 ở giữa.",
    formulas: [
      { label: "Giới thiệu danh từ", code: "S + 是 + Danh từ  (我是学生)" },
      { label: "Mô tả tính từ", code: "S + 很 + Tính từ  (今天很热 - Hôm nay nóng)" }
    ],
    examples: [
      { zh: "我是越南人。", py: "Wǒ shì Yuènán rén.", vi: "Tôi là người Việt Nam." },
      { zh: "今天我很高兴。", py: "Jīntiān wǒ hěn gāoxìng.", vi: "Hôm nay tôi rất vui." }
    ],
    warning: "Không bao giờ nói '我是高兴' (Sai!). Trước tính từ không dùng 是."
  },
  {
    id: "zhg3", number: "Bài 03", title: "Đặt câu hỏi với 吗 (ma) & 什么 (shénme)",
    summary: "Chỉ cần thêm chữ 吗 (ma) vào cuối câu trần thuật bất kỳ là biến ngay thành câu hỏi Có/Không!",
    formulas: [
      { label: "Câu hỏi Có/Không", code: "Câu bình thường + 吗？" },
      { label: "Hỏi cái gì / bao nhiêu", code: "什么 (cái gì) · 多少钱 (bao nhiêu tiền) · 哪儿 (ở đâu)" }
    ],
    examples: [
      { zh: "你喜欢喝茶吗？", py: "Nǐ xǐhuan hē chá ma?", vi: "Bạn có thích uống trà không?" },
      { zh: "这个多少钱？", py: "Zhège duōshao qián?", vi: "Cái này bao nhiêu tiền?" }
    ],
    warning: "Không đảo ngữ giống tiếng Anh — giữ nguyên trật tự câu rồi gắn 吗 vào cuối là xong."
  },
  {
    id: "zhg4", number: "Bài 04", title: "Thì Quá khứ (了) & Đang diễn ra (正在)",
    summary: "Tiếng Trung không biến đổi động từ: chỉ cần gắn 了 (le) sau động từ để báo đã xong, hoặc 正在 (zhèngzài) trước động từ để báo đang làm.",
    formulas: [
      { label: "Đã xảy ra / hoàn tất", code: "S + Động từ + 了 (+ O)" },
      { label: "Đang diễn ra", code: "S + 正在 + Động từ + O" }
    ],
    examples: [
      { zh: "我买了一件衣服。", py: "Wǒ mǎi le yí jiàn yīfu.", vi: "Tôi đã mua một chiếc áo." },
      { zh: "我正在学习汉语。", py: "Wǒ zhèngzài xuéxí Hànyǔ.", vi: "Tôi đang học tiếng Trung." }
    ],
    warning: "Quá khứ phủ định dùng 没 (méi) và bỏ 了: 我没去 (Tôi đã không đi)."
  }
];

    // ==================== SUPABASE CONFIG (Chủ web điền trong js/config.js) ====================
    window.ENGSTART_CONFIG = window.ENGSTART_CONFIG || {
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: ""
    };
