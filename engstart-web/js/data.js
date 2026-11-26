// ==================== 10 BEGINNER TOPICS (100 CURATED A0–A1 WORDS) ====================
    // Compact builder to keep all 100 words rich, accurate, and readable
    const W = (id, en, ipa, pos, vi, usage, exEn, exBlank, exVi) => ({ id, en, ipa, pos, vi, usage, exEn, exBlank, exVi });

    const TOPICS_DATA = [
      {
        id: "greeting", num: "01", title: "Chào hỏi & Giao tiếp", enTitle: "Greetings & Basics",
        desc: "Những câu chào, cảm ơn, xin lỗi và cách mở lời tự nhiên nhất cho người mới bắt đầu.",
        lessons: [
          {
            id: "t1_l1", num: "Bài 01", title: "Chào hỏi & Lịch sự cơ bản",
            words: [
              W("w1", "hello", "/həˈloʊ/", "THÁN TỪ", "xin chào", "Dùng để chào bất kỳ ai, mọi lúc trong ngày.", "Hello, nice to meet you!", "____, nice to meet you!", "Xin chào, rất vui được gặp bạn!"),
              W("w2", "thank you", "/θæŋk juː/", "CỤM TỪ", "cảm ơn bạn", "thank you + for + danh từ / V-ing.", "Thank you for your help.", "____ for your help.", "Cảm ơn bạn đã giúp đỡ."),
              W("w3", "sorry", "/ˈsɑːri/", "TÍNH TỪ", "xin lỗi", "I am sorry + lý do.", "I am sorry I am late.", "I am ____ I am late.", "Tôi xin lỗi vì đến muộn."),
              W("w4", "please", "/pliːz/", "THÁN TỪ", "làm ơn, vui lòng", "Đặt ở đầu hoặc cuối câu nhờ vả để lịch sự hơn.", "Speak slowly, please.", "Speak slowly, ____.", "Làm ơn hãy nói chậm thôi."),
              W("w5", "goodbye", "/ˌɡʊdˈbaɪ/", "THÁN TỪ", "tạm biệt", "Dùng khi chia tay; thân mật hơn nói 'Bye'.", "Goodbye, see you tomorrow!", "____, see you tomorrow!", "Tạm biệt, hẹn gặp lại ngày mai!")
            ],
            sentences: [
              { vi: "Xin chào, rất vui được gặp bạn.", words: ["Hello", "nice", "to", "meet", "you"] },
              { vi: "Cảm ơn bạn đã giúp đỡ.", words: ["Thank", "you", "for", "your", "help"] }
            ]
          },
          {
            id: "t1_l2", num: "Bài 02", title: "Làm quen & Hỏi thăm",
            words: [
              W("w6", "welcome", "/ˈwelkəm/", "TÍNH TỪ", "không có chi / chào mừng", "You are welcome (Đáp lại lời cảm ơn).", "You are very welcome.", "You are very ____.", "Không có gì đâu."),
              W("w7", "name", "/neɪm/", "DANH TỪ", "tên", "My name is... / What is your name?", "My name is Minh.", "My ____ is Minh.", "Tên tôi là Minh."),
              W("w8", "excuse me", "/ɪkˈskjuːz miː/", "CỤM TỪ", "xin phép / cho tôi hỏi", "Dùng trước khi hỏi đường hoặc gọi phục vụ.", "Excuse me, where is the bank?", "____, where is the bank?", "Cho tôi hỏi, ngân hàng ở đâu vậy?"),
              W("w9", "fine", "/faɪn/", "TÍNH TỪ", "khỏe, ổn", "I am fine, thank you.", "I am fine, thank you.", "I am ____, thank you.", "Tôi khỏe, cảm ơn bạn."),
              W("w10", "meet", "/miːt/", "ĐỘNG TỪ", "gặp gỡ", "Nice to meet you (Rất vui được gặp bạn).", "I am happy to meet you.", "I am happy to ____ you.", "Tôi rất vui được gặp bạn.")
            ],
            sentences: [
              { vi: "Tên của tôi là Minh.", words: ["My", "name", "is", "Minh"] },
              { vi: "Tôi khỏe, cảm ơn bạn.", words: ["I", "am", "fine", "thank", "you"] }
            ]
          }
        ]
      },
      {
        id: "education", num: "02", title: "Học tập & Trường lớp", enTitle: "Education & Learning",
        desc: "Từ vựng chủ đề học tập rút gọn cho trình độ A0–A1 để nói về việc học tiếng Anh, lớp học và thầy cô.",
        lessons: [
          {
            id: "t2_l1", num: "Bài 01", title: "Lớp học & Thầy cô",
            words: [
              W("w11", "student", "/ˈstuːdnt/", "DANH TỪ", "học sinh, sinh viên", "be a student (là học viên).", "I am a new student.", "I am a new ____.", "Tôi là học viên mới."),
              W("w12", "teacher", "/ˈtiːtʃər/", "DANH TỪ", "giáo viên", "an English teacher (giáo viên tiếng Anh).", "Our teacher is very kind.", "Our ____ is very kind.", "Giáo viên của chúng tôi rất tốt bụng."),
              W("w13", "school", "/skuːl/", "DANH TỪ", "trường học", "go to school (đi học — không thêm 'the').", "Children go to school at 7 AM.", "Children go to ____ at 7 AM.", "Trẻ em đi học lúc 7 giờ sáng."),
              W("w14", "lesson", "/ˈlesn/", "DANH TỪ", "bài học", "study a lesson / this lesson.", "This lesson is very easy.", "This ____ is very easy.", "Bài học này rất dễ."),
              W("w15", "book", "/bʊk/", "DANH TỪ", "quyển sách", "read a book (đọc sách).", "I read an English book.", "I read an English ____.", "Tôi đọc một quyển sách tiếng Anh.")
            ],
            sentences: [
              { vi: "Giáo viên của chúng tôi rất tốt bụng.", words: ["Our", "teacher", "is", "very", "kind"] },
              { vi: "Bài học này rất dễ.", words: ["This", "lesson", "is", "very", "easy"] }
            ]
          },
          {
            id: "t2_l2", num: "Bài 02", title: "Hoạt động học mỗi ngày",
            words: [
              W("w16", "study", "/ˈstʌdi/", "ĐỘNG TỪ", "học tập", "study + môn học (study English).", "I study English every night.", "I ____ English every night.", "Tôi học tiếng Anh mỗi tối."),
              W("w17", "understand", "/ˌʌndərˈstænd/", "ĐỘNG TỪ", "hiểu", "I understand / I don't understand.", "Now I understand this word.", "Now I ____ this word.", "Bây giờ tôi đã hiểu từ này."),
              W("w18", "practice", "/ˈpræktɪs/", "ĐỘNG TỪ", "luyện tập", "practice speaking / practice every day.", "I practice English every day.", "I ____ English every day.", "Tôi luyện tiếng Anh mỗi ngày."),
              W("w19", "homework", "/ˈhoʊmwɜːrk/", "DANH TỪ", "bài tập về nhà", "do homework (không thêm s).", "I do my homework after dinner.", "I do my ____ after dinner.", "Tôi làm bài tập về nhà sau bữa tối."),
              W("w20", "question", "/ˈkwestʃən/", "DANH TỪ", "câu hỏi", "ask a question / answer a question.", "I have a simple question.", "I have a simple ____.", "Tôi có một câu hỏi đơn giản.")
            ],
            sentences: [
              { vi: "Tôi học tiếng Anh mỗi tối.", words: ["I", "study", "English", "every", "night"] },
              { vi: "Tôi có một câu hỏi đơn giản.", words: ["I", "have", "a", "simple", "question"] }
            ]
          }
        ]
      },
      {
        id: "family", num: "03", title: "Gia đình & Bạn bè", enTitle: "Family & People",
        desc: "Cách giới thiệu người thân, bạn bè và mô tả mọi người xung quanh bằng câu ngắn gọn.",
        lessons: [
          {
            id: "t3_l1", num: "Bài 01", title: "Các thành viên trong nhà",
            words: [
              W("w21", "family", "/ˈfæməli/", "DANH TỪ", "gia đình", "my family / live with my family.", "I love my family very much.", "I love my ____ very much.", "Tôi yêu gia đình mình rất nhiều."),
              W("w22", "mother", "/ˈmʌðər/", "DANH TỪ", "mẹ", "Trang trọng: mother; thân mật: mom.", "My mother cooks very well.", "My ____ cooks very well.", "Mẹ tôi nấu ăn rất ngon."),
              W("w23", "father", "/ˈfɑːðər/", "DANH TỪ", "bố, cha", "Trang trọng: father; thân mật: dad.", "My father works in a bank.", "My ____ works in a bank.", "Bố tôi làm việc ở ngân hàng."),
              W("w24", "brother", "/ˈbrʌðər/", "DANH TỪ", "anh / em trai", "older brother (anh trai), younger brother (em trai).", "My brother likes football.", "My ____ likes football.", "Anh trai tôi thích bóng đá."),
              W("w25", "sister", "/ˈsɪstər/", "DANH TỪ", "chị / em gái", "older sister (chị gái), younger sister (em gái).", "My sister is a doctor.", "My ____ is a doctor.", "Chị gái tôi là bác sĩ.")
            ],
            sentences: [
              { vi: "Tôi yêu gia đình mình rất nhiều.", words: ["I", "love", "my", "family", "very", "much"] },
              { vi: "Chị gái tôi là một bác sĩ.", words: ["My", "sister", "is", "a", "doctor"] }
            ]
          },
          {
            id: "t3_l2", num: "Bài 02", title: "Bạn bè & Mọi người",
            words: [
              W("w26", "friend", "/frend/", "DANH TỪ", "bạn bè", "best friend (bạn thân).", "She is my best friend.", "She is my best ____.", "Cô ấy là bạn thân nhất của tôi."),
              W("w27", "people", "/ˈpiːpl/", "DANH TỪ", "mọi người", "Luôn đi với động từ số nhiều (people are...).", "Vietnamese people are friendly.", "Vietnamese ____ are friendly.", "Người Việt Nam rất thân thiện."),
              W("w28", "child", "/tʃaɪld/", "DANH TỪ", "đứa trẻ", "Số ít: child — Số nhiều: children.", "The child is very happy.", "The ____ is very happy.", "Đứa trẻ rất vui vẻ."),
              W("w29", "friendly", "/ˈfrendli/", "TÍNH TỪ", "thân thiện", "be friendly (thân thiện).", "My neighbors are very friendly.", "My neighbors are very ____.", "Hàng xóm của tôi rất thân thiện."),
              W("w30", "together", "/təˈɡeðər/", "TRẠNG TỪ", "cùng nhau", "eat together / work together.", "We eat dinner together.", "We eat dinner ____.", "Chúng tôi ăn tối cùng nhau.")
            ],
            sentences: [
              { vi: "Cô ấy là bạn thân nhất của tôi.", words: ["She", "is", "my", "best", "friend"] },
              { vi: "Chúng tôi ăn tối cùng nhau.", words: ["We", "eat", "dinner", "together"] }
            ]
          }
        ]
      },
      {
        id: "work", num: "04", title: "Công việc & Văn phòng", enTitle: "Work & Office",
        desc: "Các từ thiết yếu để giới thiệu nghề nghiệp, lịch làm việc và môi trường công sở.",
        lessons: [
          {
            id: "t4_l1", num: "Bài 01", title: "Nơi làm việc cơ bản",
            words: [
              W("w31", "work", "/wɜːrk/", "ĐỘNG TỪ", "làm việc", "go to work (đi làm), at work.", "I go to work at 8 AM.", "I go to ____ at 8 AM.", "Tôi đi làm lúc 8 giờ sáng."),
              W("w32", "office", "/ˈɑːfɪs/", "DANH TỪ", "văn phòng", "in an office / at the office.", "My office is near my home.", "My ____ is near my home.", "Văn phòng của tôi gần nhà."),
              W("w33", "company", "/ˈkʌmpəni/", "DANH TỪ", "công ty", "work for a company.", "He works for a big company.", "He works for a big ____.", "Anh ấy làm cho một công ty lớn."),
              W("w34", "meeting", "/ˈmiːtɪŋ/", "DANH TỪ", "cuộc họp", "have a meeting (có cuộc họp).", "We have a meeting at 10 AM.", "We have a ____ at 10 AM.", "Chúng tôi có cuộc họp lúc 10 giờ sáng."),
              W("w35", "job", "/dʒɑːb/", "DANH TỪ", "nghề nghiệp, việc làm", "a good job / a new job.", "I like my new job.", "I like my new ____.", "Tôi thích công việc mới của mình.")
            ],
            sentences: [
              { vi: "Tôi đi làm lúc 8 giờ sáng.", words: ["I", "go", "to", "work", "at", "8", "AM"] },
              { vi: "Tôi thích công việc mới của mình.", words: ["I", "like", "my", "new", "job"] }
            ]
          },
          {
            id: "t4_l2", num: "Bài 02", title: "Trao đổi & Hợp tác",
            words: [
              W("w36", "busy", "/ˈbɪzi/", "TÍNH TỪ", "bận rộn", "be busy today / busy with...", "I am very busy today.", "I am very ____ today.", "Hôm nay tôi rất bận."),
              W("w37", "email", "/ˈiːmeɪl/", "DANH TỪ", "thư điện tử", "send an email / check email.", "Please send me an email.", "Please send me an ____.", "Vui lòng gửi cho tôi một email."),
              W("w38", "help", "/help/", "ĐỘNG TỪ", "giúp đỡ", "Can you help me?", "Can you help me, please?", "Can you ____ me, please?", "Bạn có thể giúp tôi được không?"),
              W("w39", "team", "/tiːm/", "DANH TỪ", "đội, nhóm", "a great team / work in a team.", "My team is very supportive.", "My ____ is very supportive.", "Nhóm của tôi rất hay hỗ trợ nhau."),
              W("w40", "salary", "/ˈsæləri/", "DANH TỪ", "tiền lương", "a good salary / monthly salary.", "She gets a good salary.", "She gets a good ____.", "Cô ấy nhận được mức lương tốt.")
            ],
            sentences: [
              { vi: "Hôm nay tôi rất bận.", words: ["I", "am", "very", "busy", "today"] },
              { vi: "Vui lòng gửi cho tôi một email.", words: ["Please", "send", "me", "an", "email"] }
            ]
          }
        ]
      },
      {
        id: "food", num: "05", title: "Ăn uống & Nhà hàng", enTitle: "Food & Drinks",
        desc: "Từ vựng gọi món, đồ uống quen thuộc và cách khen món ăn ngon.",
        lessons: [
          {
            id: "t5_l1", num: "Bài 01", title: "Đồ uống & Bữa ăn",
            words: [
              W("w41", "water", "/ˈwɔːtər/", "DANH TỪ", "nước uống", "a glass of water / some water.", "Can I have some water?", "Can I have some ____?", "Cho tôi một ít nước được không?"),
              W("w42", "coffee", "/ˈkɑːfi/", "DANH TỪ", "cà phê", "drink coffee / iced coffee.", "I drink coffee every morning.", "I drink ____ every morning.", "Tôi uống cà phê mỗi sáng."),
              W("w43", "breakfast", "/ˈbrekfəst/", "DANH TỪ", "bữa sáng", "eat breakfast / have breakfast.", "I eat breakfast at 7 AM.", "I eat ____ at 7 AM.", "Tôi ăn sáng lúc 7 giờ."),
              W("w44", "lunch", "/lʌntʃ/", "DANH TỪ", "bữa trưa", "have lunch (ăn trưa).", "Let's have lunch together.", "Let's have ____ together.", "Hãy cùng nhau ăn trưa nhé."),
              W("w45", "dinner", "/ˈdɪnər/", "DANH TỪ", "bữa tối", "cook dinner / eat dinner.", "My mom cooks dinner at 6 PM.", "My mom cooks ____ at 6 PM.", "Mẹ tôi nấu bữa tối lúc 6 giờ.")
            ],
            sentences: [
              { vi: "Tôi uống cà phê mỗi sáng.", words: ["I", "drink", "coffee", "every", "morning"] },
              { vi: "Hãy cùng nhau ăn trưa nhé.", words: ["Let's", "have", "lunch", "together"] }
            ]
          },
          {
            id: "t5_l2", num: "Bài 02", title: "Gọi món & Hương vị",
            words: [
              W("w46", "delicious", "/dɪˈlɪʃəs/", "TÍNH TỪ", "ngon miệng", "This food is delicious!", "This pho is very delicious!", "This pho is very ____!", "Món phở này rất ngon!"),
              W("w47", "hungry", "/ˈhʌŋɡri/", "TÍNH TỪ", "đói bụng", "I am hungry (không quên 'am').", "I am very hungry now.", "I am very ____ now.", "Bây giờ tôi rất đói."),
              W("w48", "menu", "/ˈmenjuː/", "DANH TỪ", "thực đơn", "Can I see the menu?", "Can I see the menu, please?", "Can I see the ____, please?", "Cho tôi xem thực đơn được không?"),
              W("w49", "order", "/ˈɔːrdər/", "ĐỘNG TỪ", "gọi món / đặt hàng", "order food / order coffee.", "I want to order a tea.", "I want to ____ a tea.", "Tôi muốn gọi một ly trà."),
              W("w50", "bill", "/bɪl/", "DANH TỪ", "hóa đơn", "pay the bill (thanh toán hóa đơn).", "Can I have the bill, please?", "Can I have the ____, please?", "Cho tôi xin hóa đơn tính tiền nhé.")
            ],
            sentences: [
              { vi: "Bây giờ tôi rất đói.", words: ["I", "am", "very", "hungry", "now"] },
              { vi: "Món phở này rất ngon.", words: ["This", "pho", "is", "very", "delicious"] }
            ]
          }
        ]
      },
      {
        id: "shopping", num: "06", title: "Mua sắm & Giá cả", enTitle: "Shopping & Money",
        desc: "Từ vựng đi siêu thị, hỏi giá, chọn cỡ quần áo và thanh toán bằng tiền mặt hoặc thẻ.",
        lessons: [
          {
            id: "t6_l1", num: "Bài 01", title: "Tiền bạc & Giá cả",
            words: [
              W("w51", "money", "/ˈmʌni/", "DANH TỪ", "tiền bạc", "save money (tiết kiệm tiền).", "I want to save money.", "I want to save ____.", "Tôi muốn tiết kiệm tiền."),
              W("w52", "price", "/praɪs/", "DANH TỪ", "giá cả", "good price / What is the price?", "The price is very good.", "The ____ is very good.", "Mức giá này rất tốt."),
              W("w53", "cheap", "/tʃiːp/", "TÍNH TỪ", "rẻ", "Trái nghĩa với 'expensive' (đắt).", "This shirt is very cheap.", "This shirt is very ____.", "Chiếc áo này rất rẻ."),
              W("w54", "expensive", "/ɪkˈspensɪv/", "TÍNH TỪ", "đắt tiền", "too expensive (quá đắt).", "That phone is too expensive.", "That phone is too ____.", "Chiếc điện thoại đó quá đắt."),
              W("w55", "buy", "/baɪ/", "ĐỘNG TỪ", "mua", "buy + đồ vật (Quá khứ: bought).", "I want to buy some fruit.", "I want to ____ some fruit.", "Tôi muốn mua một ít trái cây.")
            ],
            sentences: [
              { vi: "Chiếc áo này rất rẻ.", words: ["This", "shirt", "is", "very", "cheap"] },
              { vi: "Tôi muốn tiết kiệm tiền.", words: ["I", "want", "to", "save", "money"] }
            ]
          },
          {
            id: "t6_l2", num: "Bài 02", title: "Cửa hàng & Thanh toán",
            words: [
              W("w56", "shop", "/ʃɑːp/", "DANH TỪ", "cửa hàng", "coffee shop / clothes shop.", "There is a shop near here.", "There is a ____ near here.", "Có một cửa hàng gần đây."),
              W("w57", "market", "/ˈmɑːrkɪt/", "DANH TỪ", "chợ / siêu thị", "go to the market (đi chợ).", "My mom goes to the market.", "My mom goes to the ____.", "Mẹ tôi đi chợ."),
              W("w58", "size", "/saɪz/", "DANH TỪ", "kích cỡ", "medium size / Do you have a larger size?", "Do you have a bigger size?", "Do you have a bigger ____?", "Bạn có cỡ lớn hơn không?"),
              W("w59", "pay", "/peɪ/", "ĐỘNG TỪ", "trả tiền, thanh toán", "pay by card / pay in cash.", "Can I pay by card?", "Can I ____ by card?", "Tôi có thể thanh toán bằng thẻ không?"),
              W("w60", "discount", "/ˈdɪskaʊnt/", "DANH TỪ", "giảm giá", "get a discount (được giảm giá).", "Is there any discount today?", "Is there any ____ today?", "Hôm nay có giảm giá không?")
            ],
            sentences: [
              { vi: "Tôi có thể thanh toán bằng thẻ không?", words: ["Can", "I", "pay", "by", "card"] },
              { vi: "Bạn có cỡ lớn hơn không?", words: ["Do", "you", "have", "a", "bigger", "size"] }
            ]
          }
        ]
      },
      {
        id: "daily", num: "07", title: "Thời gian & Thói quen", enTitle: "Time & Daily Life",
        desc: "Nói về hôm nay, ngày mai, thời tiết và các động từ diễn tả thói quen hằng ngày.",
        lessons: [
          {
            id: "t7_l1", num: "Bài 01", title: "Thời gian & Thời tiết",
            words: [
              W("w61", "today", "/təˈdeɪ/", "TRẠNG TỪ", "hôm nay", "Đặt ở đầu hoặc cuối câu.", "Today is a beautiful day.", "____ is a beautiful day.", "Hôm nay là một ngày đẹp trời."),
              W("w62", "tomorrow", "/təˈmɑːroʊ/", "TRẠNG TỪ", "ngày mai", "see you tomorrow.", "I will call you tomorrow.", "I will call you ____.", "Tôi sẽ gọi cho bạn ngày mai."),
              W("w63", "yesterday", "/ˈjestərdeɪ/", "TRẠNG TỪ", "hôm qua", "Dấu hiệu của thì Quá khứ đơn.", "I met him yesterday.", "I met him ____.", "Tôi đã gặp anh ấy hôm qua."),
              W("w64", "weather", "/ˈweðər/", "DANH TỪ", "thời tiết", "The weather is hot/cold/nice.", "The weather is hot today.", "The ____ is hot today.", "Hôm nay thời tiết nóng."),
              W("w65", "home", "/hoʊm/", "DANH TỪ", "nhà, tổ ấm", "go home (không dùng 'to'), at home.", "I go home at 6 PM.", "I go ____ at 6 PM.", "Tôi về nhà lúc 6 giờ chiều.")
            ],
            sentences: [
              { vi: "Hôm nay thời tiết nóng.", words: ["The", "weather", "is", "hot", "today"] },
              { vi: "Tôi về nhà lúc 6 giờ chiều.", words: ["I", "go", "home", "at", "6", "PM"] }
            ]
          },
          {
            id: "t7_l2", num: "Bài 02", title: "Động từ giao tiếp cốt lõi",
            words: [
              W("w66", "speak", "/spiːk/", "ĐỘNG TỪ", "nói (ngôn ngữ)", "speak English / speak slowly.", "I want to speak English well.", "I want to ____ English well.", "Tôi muốn nói tiếng Anh tốt."),
              W("w67", "listen", "/ˈlɪsn/", "ĐỘNG TỪ", "lắng nghe", "listen to + âm thanh (luôn có 'to').", "I listen to English music.", "I ____ to English music.", "Tôi nghe nhạc tiếng Anh."),
              W("w68", "need", "/niːd/", "ĐỘNG TỪ", "cần", "need + danh từ / need to + động từ.", "I need a cup of water.", "I ____ a cup of water.", "Tôi cần một ly nước."),
              W("w69", "want", "/wɒnt/", "ĐỘNG TỪ", "muốn", "want to + động từ.", "I want to learn every day.", "I ____ to learn every day.", "Tôi muốn học mỗi ngày."),
              W("w70", "sleep", "/sliːp/", "ĐỘNG TỪ", "ngủ", "go to sleep / sleep early.", "I sleep at 10 PM every night.", "I ____ at 10 PM every night.", "Tôi ngủ lúc 10 giờ mỗi tối.")
            ],
            sentences: [
              { vi: "Tôi muốn nói tiếng Anh tốt.", words: ["I", "want", "to", "speak", "English", "well"] },
              { vi: "Tôi nghe nhạc tiếng Anh.", words: ["I", "listen", "to", "English", "music"] }
            ]
          }
        ]
      },
      {
        id: "travel", num: "08", title: "Du lịch & Hỏi đường", enTitle: "Travel & Directions",
        desc: "Từ vựng đi máy bay, đặt khách sạn, hỏi đường và di chuyển khi đi du lịch nước ngoài.",
        lessons: [
          {
            id: "t8_l1", num: "Bài 01", title: "Sân bay & Khách sạn",
            words: [
              W("w71", "airport", "/ˈerpɔːrt/", "DANH TỪ", "sân bay", "go to the airport / at the airport.", "We arrive at the airport early.", "We arrive at the ____ early.", "Chúng tôi đến sân bay sớm."),
              W("w72", "ticket", "/ˈtɪkɪt/", "DANH TỪ", "vé (máy bay, xe)", "buy a ticket / plane ticket.", "Here is my plane ticket.", "Here is my plane ____.", "Đây là vé máy bay của tôi."),
              W("w73", "passport", "/ˈpæspɔːrt/", "DANH TỪ", "hộ chiếu", "show your passport.", "Don't forget your passport.", "Don't forget your ____.", "Đừng quên hộ chiếu của bạn nhé."),
              W("w74", "hotel", "/hoʊˈtel/", "DANH TỪ", "khách sạn", "stay at a hotel / book a hotel.", "Our hotel is near the beach.", "Our ____ is near the beach.", "Khách sạn của chúng tôi gần biển."),
              W("w75", "luggage", "/ˈlʌɡɪdʒ/", "DANH TỪ", "hành lý", "Danh từ không đếm được (không thêm s).", "My luggage is very heavy.", "My ____ is very heavy.", "Hành lý của tôi rất nặng.")
            ],
            sentences: [
              { vi: "Khách sạn của chúng tôi gần biển.", words: ["Our", "hotel", "is", "near", "the", "beach"] },
              { vi: "Hành lý của tôi rất nặng.", words: ["My", "luggage", "is", "very", "heavy"] }
            ]
          },
          {
            id: "t8_l2", num: "Bài 02", title: "Hỏi đường & Phương tiện",
            words: [
              W("w76", "map", "/mæp/", "DANH TỪ", "bản đồ", "look at the map / Google Maps.", "I check the map on my phone.", "I check the ____ on my phone.", "Tôi xem bản đồ trên điện thoại."),
              W("w77", "left", "/left/", "DANH TỪ / TRẠNG TỪ", "bên trái", "turn left (rẽ trái).", "Turn left at the traffic light.", "Turn ____ at the traffic light.", "Rẽ trái ở chỗ đèn giao thông."),
              W("w78", "right", "/raɪt/", "DANH TỪ / TRẠNG TỪ", "bên phải / đúng", "turn right (rẽ phải).", "The bank is on your right.", "The bank is on your ____.", "Ngân hàng ở phía bên phải bạn."),
              W("w79", "straight", "/streɪt/", "TRẠNG TỪ", "đi thẳng", "go straight ahead (đi thẳng về phía trước).", "Go straight for two minutes.", "Go ____ for two minutes.", "Đi thẳng khoảng hai phút."),
              W("w80", "taxi", "/ˈtæksi/", "DANH TỪ", "xe taxi", "take a taxi (bắt taxi).", "Let's take a taxi to the hotel.", "Let's take a ____ to the hotel.", "Hãy bắt taxi về khách sạn nhé.")
            ],
            sentences: [
              { vi: "Ngân hàng ở bên phải bạn.", words: ["The", "bank", "is", "on", "your", "right"] },
              { vi: "Hãy đi thẳng hai phút.", words: ["Go", "straight", "for", "two", "minutes"] }
            ]
          }
        ]
      },
      {
        id: "health", num: "09", title: "Sức khỏe & Đời sống", enTitle: "Health & Well-being",
        desc: "Cách nói về sức khỏe, triệu chứng mệt mỏi cơ bản và thói quen sống lành mạnh.",
        lessons: [
          {
            id: "t9_l1", num: "Bài 01", title: "Cảm giác & Khám bệnh",
            words: [
              W("w81", "doctor", "/ˈdɑːktər/", "DANH TỪ", "bác sĩ", "see a doctor (đi khám bác sĩ).", "You should see a doctor.", "You should see a ____.", "Bạn nên đi khám bác sĩ."),
              W("w82", "hospital", "/ˈhɑːspɪtl/", "DANH TỪ", "bệnh viện", "go to the hospital.", "The hospital is on this street.", "The ____ is on this street.", "Bệnh viện nằm trên con đường này."),
              W("w83", "tired", "/ˈtaɪərd/", "TÍNH TỪ", "mệt mỏi", "feel tired / be tired.", "I feel a little tired today.", "I feel a little ____ today.", "Hôm nay tôi cảm thấy hơi mệt."),
              W("w84", "sick", "/sɪk/", "TÍNH TỪ", "bị ốm, bệnh", "be sick / feel sick.", "He is sick, so he stays home.", "He is ____, so he stays home.", "Anh ấy bị ốm nên ở nhà."),
              W("w85", "medicine", "/ˈmedɪsn/", "DANH TỪ", "thuốc uống", "take medicine (uống thuốc — dùng 'take', không dùng 'drink').", "Take this medicine after meals.", "Take this ____ after meals.", "Uống thuốc này sau bữa ăn.")
            ],
            sentences: [
              { vi: "Bạn nên đi khám bác sĩ.", words: ["You", "should", "see", "a", "doctor"] },
              { vi: "Hôm nay tôi cảm thấy hơi mệt.", words: ["I", "feel", "a", "little", "tired", "today"] }
            ]
          },
          {
            id: "t9_l2", num: "Bài 02", title: "Sống khỏe mỗi ngày",
            words: [
              W("w86", "healthy", "/ˈhelθi/", "TÍNH TỪ", "khỏe mạnh, lành mạnh", "healthy food / stay healthy.", "Vegetables are very healthy.", "Vegetables are very ____.", "Rau xanh rất tốt cho sức khỏe."),
              W("w87", "exercise", "/ˈeksərsaɪz/", "DANH TỪ / ĐỘNG TỪ", "tập thể dục", "do exercise (tập thể dục).", "I do exercise every morning.", "I do ____ every morning.", "Tôi tập thể dục mỗi sáng."),
              W("w88", "headache", "/ˈhedeɪk/", "DANH TỪ", "đau đầu", "have a headache (bị đau đầu).", "I have a bad headache.", "I have a bad ____.", "Tôi bị đau đầu nặng."),
              W("w89", "rest", "/rest/", "DANH TỪ / ĐỘNG TỪ", "nghỉ ngơi", "take a rest / get some rest.", "You need to get some rest.", "You need to get some ____.", "Bạn cần nghỉ ngơi một chút."),
              W("w90", "strong", "/strɔːŋ/", "TÍNH TỪ", "khỏe mạnh, vững chắc", "stay strong / strong body.", "Running makes my body strong.", "Running makes my body ____.", "Chạy bộ giúp cơ thể tôi khỏe mạnh.")
            ],
            sentences: [
              { vi: "Tôi tập thể dục mỗi sáng.", words: ["I", "do", "exercise", "every", "morning"] },
              { vi: "Bạn cần nghỉ ngơi một chút.", words: ["You", "need", "to", "get", "some", "rest"] }
            ]
          }
        ]
      },
      {
        id: "tech", num: "10", title: "Công nghệ & Giải trí", enTitle: "Tech & Free Time",
        desc: "Từ vựng về điện thoại, mạng internet, phim ảnh và sở thích lúc rảnh rỗi.",
        lessons: [
          {
            id: "t10_l1", num: "Bài 01", title: "Thiết bị & Internet",
            words: [
              W("w91", "phone", "/foʊn/", "DANH TỪ", "điện thoại", "phone number / use my phone.", "What is your phone number?", "What is your ____ number?", "Số điện thoại của bạn là gì?"),
              W("w92", "computer", "/kəmˈpjuːtər/", "DANH TỪ", "máy tính", "use a computer.", "I work on my computer.", "I work on my ____.", "Tôi làm việc trên máy tính."),
              W("w93", "internet", "/ˈɪntərnet/", "DANH TỪ", "mạng internet", "on the internet.", "The internet here is very fast.", "The ____ here is very fast.", "Mạng internet ở đây rất nhanh."),
              W("w94", "password", "/ˈpæswɜːrd/", "DANH TỪ", "mật khẩu", "wifi password (mật khẩu wifi).", "What is the wifi password?", "What is the wifi ____?", "Mật khẩu wifi là gì vậy?"),
              W("w95", "message", "/ˈmesɪdʒ/", "DANH TỪ", "tin nhắn", "send a message (gửi tin nhắn).", "Send me a message later.", "Send me a ____ later.", "Lát nữa nhắn tin cho tôi nhé.")
            ],
            sentences: [
              { vi: "Mật khẩu wifi là gì vậy?", words: ["What", "is", "the", "wifi", "password"] },
              { vi: "Mạng internet ở đây rất nhanh.", words: ["The", "internet", "here", "is", "very", "fast"] }
            ]
          },
          {
            id: "t10_l2", num: "Bài 02", title: "Sở thích & Thư giãn",
            words: [
              W("w96", "music", "/ˈmjuːzɪk/", "DANH TỪ", "âm nhạc", "listen to music.", "I love listening to music.", "I love listening to ____.", "Tôi thích nghe nhạc."),
              W("w97", "movie", "/ˈmuːvi/", "DANH TỪ", "bộ phim", "watch a movie (xem phim).", "Let's watch a movie tonight.", "Let's watch a ____ tonight.", "Tối nay cùng xem phim nhé."),
              W("w98", "photo", "/ˈfoʊtoʊ/", "DANH TỪ", "bức ảnh", "take a photo (chụp ảnh).", "Can you take a photo for me?", "Can you take a ____ for me?", "Bạn chụp giúp tôi một tấm ảnh được không?"),
              W("w99", "weekend", "/ˌwiːkˈend/", "DANH TỪ", "cuối tuần", "on the weekend / Have a nice weekend!", "Have a nice weekend!", "Have a nice ____!", "Chúc bạn cuối tuần vui vẻ!"),
              W("w100", "enjoy", "/ɪnˈdʒɔɪ/", "ĐỘNG TỪ", "tận hưởng, thích thú", "enjoy + danh từ / V-ing.", "I enjoy learning English now.", "I ____ learning English now.", "Bây giờ tôi thấy thích học tiếng Anh.")
            ],
            sentences: [
              { vi: "Tối nay hãy cùng xem phim nhé.", words: ["Let's", "watch", "a", "movie", "tonight"] },
              { vi: "Chúc bạn cuối tuần vui vẻ!", words: ["Have", "a", "nice", "weekend"] }
            ]
          }
        ]
      }
      ,{
        id: "colors", num: "11", title: "Màu sắc & Hình dạng", enTitle: "Colors & Shapes",
        desc: "Các màu sắc rực rỡ và hình dạng cơ bản giúp bé và người mới mô tả mọi đồ vật xung quanh.",
        lessons: [
          {
            id: "t11_l1", num: "Bài 01", title: "5 Màu sắc tươi sáng",
            words: [
              W("w101", "red", "/red/", "TÍNH TỪ", "màu đỏ", "a red apple (một quả táo đỏ).", "The apple is red.", "The apple is ____.", "Quả táo có màu đỏ."),
              W("w102", "blue", "/bluː/", "TÍNH TỪ", "màu xanh dương", "blue sky (bầu trời xanh).", "The sky is blue today.", "The sky is ____ today.", "Hôm nay bầu trời có màu xanh dương."),
              W("w103", "yellow", "/ˈjeloʊ/", "TÍNH TỪ", "màu vàng", "a yellow sun / yellow banana.", "I like this yellow hat.", "I like this ____ hat.", "Tôi thích chiếc mũ màu vàng này."),
              W("w104", "green", "/ɡriːn/", "TÍNH TỪ", "màu xanh lá", "green trees / green grass.", "The leaves are green.", "The leaves are ____.", "Những chiếc lá có màu xanh lá."),
              W("w105", "pink", "/pɪŋk/", "TÍNH TỪ", "màu hồng", "a pink flower (bông hoa màu hồng).", "She has a pink bag.", "She has a ____ bag.", "Cô ấy có một chiếc cặp màu hồng.")
            ],
            sentences: [
              { vi: "Quả táo có màu đỏ.", words: ["The", "apple", "is", "red"] },
              { vi: "Hôm nay bầu trời màu xanh dương.", words: ["The", "sky", "is", "blue", "today"] }
            ]
          },
          {
            id: "t11_l2", num: "Bài 02", title: "Màu sắc mở rộng & Hình tròn",
            words: [
              W("w106", "black", "/blæk/", "TÍNH TỪ", "màu đen", "black hair / black cat.", "He has a black dog.", "He has a ____ dog.", "Anh ấy có một chú chó màu đen."),
              W("w107", "white", "/waɪt/", "TÍNH TỪ", "màu trắng", "white clouds (những đám mây trắng).", "The clouds are white.", "The clouds are ____.", "Những đám mây có màu trắng."),
              W("w108", "orange", "/ˈɔːrɪndʒ/", "TÍNH TỪ", "màu cam", "Vừa là màu cam, vừa là quả cam.", "This balloon is orange.", "This balloon is ____.", "Quả bóng bay này có màu cam."),
              W("w109", "purple", "/ˈpɜːrpl/", "TÍNH TỪ", "màu tím", "purple grapes (nho tím).", "My favorite color is purple.", "My favorite color is ____.", "Màu yêu thích của tôi là màu tím."),
              W("w110", "circle", "/ˈsɜːrkl/", "DANH TỪ", "hình tròn", "draw a circle (vẽ một hình tròn).", "Please draw a big circle.", "Please draw a big ____.", "Hãy vẽ một hình tròn lớn nhé.")
            ],
            sentences: [
              { vi: "Những đám mây có màu trắng.", words: ["The", "clouds", "are", "white"] },
              { vi: "Màu yêu thích của tôi là màu tím.", words: ["My", "favorite", "color", "is", "purple"] }
            ]
          }
        ]
      },
      {
        id: "animals", num: "12", title: "Động vật thân quen", enTitle: "Animals",
        desc: "Những loài thú cưng và động vật đáng yêu gần gũi nhất với trẻ em và đời sống hằng ngày.",
        lessons: [
          {
            id: "t12_l1", num: "Bài 01", title: "Thú cưng & Vật nuôi",
            words: [
              W("w111", "dog", "/dɔːɡ/", "DANH TỪ", "con chó", "a cute dog (một chú chó dễ thương).", "My dog likes to run.", "My ____ likes to run.", "Chú chó của tôi thích chạy nhảy."),
              W("w112", "cat", "/kæt/", "DANH TỪ", "con mèo", "a little cat (một chú mèo nhỏ).", "The cat is sleeping on the bed.", "The ____ is sleeping on the bed.", "Chú mèo đang ngủ trên giường."),
              W("w113", "bird", "/bɜːrd/", "DANH TỪ", "con chim", "a bird can fly (chim có thể bay).", "A little bird is singing.", "A little ____ is singing.", "Một chú chim nhỏ đang hót."),
              W("w114", "fish", "/fɪʃ/", "DANH TỪ", "con cá", "Số nhiều vẫn là 'fish' (không thêm es).", "The fish swims in the water.", "The ____ swims in the water.", "Con cá bơi trong nước."),
              W("w115", "rabbit", "/ˈræbɪt/", "DANH TỪ", "con thỏ", "a white rabbit (chú thỏ trắng).", "The rabbit eats carrots.", "The ____ eats carrots.", "Chú thỏ ăn cà rốt.")
            ],
            sentences: [
              { vi: "Chú chó của tôi thích chạy.", words: ["My", "dog", "likes", "to", "run"] },
              { vi: "Chú thỏ ăn cà rốt.", words: ["The", "rabbit", "eats", "carrots"] }
            ]
          },
          {
            id: "t12_l2", num: "Bài 02", title: "Động vật vườn thú & Thiên nhiên",
            words: [
              W("w116", "elephant", "/ˈelɪfənt/", "DANH TỪ", "con voi", "an elephant (dùng 'an' vì bắt đầu bằng nguyên âm).", "The elephant is very big.", "The ____ is very big.", "Con voi rất to lớn."),
              W("w117", "lion", "/ˈlaɪən/", "DANH TỪ", "con sư tử", "a strong lion.", "The lion is the king of animals.", "The ____ is the king of animals.", "Sư tử là chúa tể muôn loài."),
              W("w118", "monkey", "/ˈmʌŋki/", "DANH TỪ", "con khỉ", "a funny monkey (chú khỉ tinh nghịch).", "The monkey loves bananas.", "The ____ loves bananas.", "Chú khỉ rất thích ăn chuối."),
              W("w119", "duck", "/dʌk/", "DANH TỪ", "con vịt", "a yellow duck (chú vịt vàng).", "The yellow duck is cute.", "The yellow ____ is cute.", "Chú vịt vàng thật dễ thương."),
              W("w120", "butterfly", "/ˈbʌtərflaɪ/", "DANH TỪ", "con bướm", "a colorful butterfly.", "Look at that pretty butterfly!", "Look at that pretty ____!", "Nhìn chú bướm xinh đẹp kia kìa!")
            ],
            sentences: [
              { vi: "Con voi rất to lớn.", words: ["The", "elephant", "is", "very", "big"] },
              { vi: "Chú khỉ rất thích chuối.", words: ["The", "monkey", "loves", "bananas"] }
            ]
          }
        ]
      },
      {
        id: "plants", num: "13", title: "Thực vật & Thiên nhiên", enTitle: "Plants & Nature",
        desc: "Từ vựng về cây cối, hoa lá, trái cây, khu vườn và thiên nhiên quanh ta.",
        lessons: [
          {
            id: "t13_l1", num: "Bài 01", title: "Cây cối & Bầu trời",
            words: [
              W("w121", "tree", "/triː/", "DANH TỪ", "cái cây", "a big tree / green tree.", "There is a tall tree outside.", "There is a tall ____ outside.", "Có một cái cây cao ở bên ngoài."),
              W("w122", "flower", "/ˈflaʊər/", "DANH TỪ", "bông hoa", "water the flowers (tưới hoa).", "This flower smells so nice.", "This ____ smells so nice.", "Bông hoa này thơm quá."),
              W("w123", "leaf", "/liːf/", "DANH TỪ", "chiếc lá", "Số ít: leaf — Số nhiều: leaves.", "A green leaf fell down.", "A green ____ fell down.", "Một chiếc lá xanh rơi xuống."),
              W("w124", "grass", "/ɡræs/", "DANH TỪ", "bãi cỏ", "green grass (cỏ xanh — không đếm được).", "Kids play on the green grass.", "Kids play on the green ____.", "Trẻ em chơi trên bãi cỏ xanh."),
              W("w125", "sun", "/sʌn/", "DANH TỪ", "mặt trời", "the sun (luôn đi với 'the').", "The sun is bright today.", "The ____ is bright today.", "Hôm nay mặt trời thật rực rỡ.")
            ],
            sentences: [
              { vi: "Hôm nay mặt trời rất sáng.", words: ["The", "sun", "is", "bright", "today"] },
              { vi: "Bông hoa này rất thơm.", words: ["This", "flower", "smells", "so", "nice"] }
            ]
          },
          {
            id: "t13_l2", num: "Bài 02", title: "Trái cây & Khu vườn",
            words: [
              W("w126", "apple", "/ˈæpl/", "DANH TỪ", "quả táo", "an apple (dùng 'an' trước apple).", "I eat an apple every day.", "I eat an ____ every day.", "Tôi ăn một quả táo mỗi ngày."),
              W("w127", "banana", "/bəˈnænə/", "DANH TỪ", "quả chuối", "a yellow banana.", "She likes sweet bananas.", "She likes sweet ____.", "Cô ấy thích chuối ngọt."),
              W("w128", "carrot", "/ˈkærət/", "DANH TỪ", "củ cà rốt", "Carrots are good for your eyes.", "I grow carrots in my garden.", "I grow ____ in my garden.", "Tôi trồng cà rốt trong vườn."),
              W("w129", "garden", "/ˈɡɑːrdn/", "DANH TỪ", "khu vườn", "in the garden (trong vườn).", "My grandma has a nice garden.", "My grandma has a nice ____.", "Bà tôi có một khu vườn đẹp."),
              W("w130", "rain", "/reɪn/", "DANH TỪ / ĐỘNG TỪ", "cơn mưa / trời mưa", "It is raining (trời đang mưa).", "Plants need water from the rain.", "Plants need water from the ____.", "Cây cối cần nước từ cơn mưa.")
            ],
            sentences: [
              { vi: "Tôi ăn một quả táo mỗi ngày.", words: ["I", "eat", "an", "apple", "every", "day"] },
              { vi: "Bà tôi có một khu vườn đẹp.", words: ["My", "grandma", "has", "a", "nice", "garden"] }
            ]
          }
        ]
      },
      {
        id: "numbers", num: "14", title: "Số đếm cơ bản (1–10)", enTitle: "Numbers 1 to 10",
        desc: "Học đếm từ 1 đến 10 chuẩn phát âm để nói tuổi tác, số lượng đồ vật và giờ giấc.",
        lessons: [
          {
            id: "t14_l1", num: "Bài 01", title: "Số đếm từ 1 đến 5",
            words: [
              W("w131", "one", "/wʌn/", "SỐ ĐẾM", "số một (1)", "Đọc là /wʌn/, không đọc là 'oăn'.", "I have one cute cat.", "I have ____ cute cat.", "Tôi có một chú mèo dễ thương."),
              W("w132", "two", "/tuː/", "SỐ ĐẾM", "số hai (2)", "two books (từ 2 trở lên nhớ thêm 's' vào danh từ).", "I have two sisters.", "I have ____ sisters.", "Tôi có hai chị em gái."),
              W("w133", "three", "/θriː/", "SỐ ĐẾM", "số ba (3)", "Nhớ đặt đầu lưỡi giữa hai răng cho âm /θ/.", "There are three apples here.", "There are ____ apples here.", "Có ba quả táo ở đây."),
              W("w134", "four", "/fɔːr/", "SỐ ĐẾM", "số bốn (4)", "four chairs (bốn cái ghế).", "A car has four wheels.", "A car has ____ wheels.", "Một chiếc ô tô có bốn bánh xe."),
              W("w135", "five", "/faɪv/", "SỐ ĐẾM", "số năm (5)", "Nhớ âm cuối /v/ nhẹ ở cuối từ.", "I have five fingers on one hand.", "I have ____ fingers on one hand.", "Tôi có năm ngón tay trên một bàn tay.")
            ],
            sentences: [
              { vi: "Có ba quả táo ở đây.", words: ["There", "are", "three", "apples", "here"] },
              { vi: "Tôi có một chú mèo dễ thương.", words: ["I", "have", "one", "cute", "cat"] }
            ]
          },
          {
            id: "t14_l2", num: "Bài 02", title: "Số đếm từ 6 đến 10",
            words: [
              W("w136", "six", "/sɪks/", "SỐ ĐẾM", "số sáu (6)", "Nhớ bật âm cuối /ks/ rõ ràng.", "I wake up at six AM.", "I wake up at ____ AM.", "Tôi thức dậy lúc sáu giờ sáng."),
              W("w137", "seven", "/ˈsevn/", "SỐ ĐẾM", "số bảy (7)", "seven days in a week (7 ngày trong tuần).", "There are seven days in a week.", "There are ____ days in a week.", "Có bảy ngày trong một tuần."),
              W("w138", "eight", "/eɪt/", "SỐ ĐẾM", "số tám (8)", "Chữ 'gh' là âm câm, đọc gọn là /eɪt/.", "My class starts at eight AM.", "My class starts at ____ AM.", "Lớp học của tôi bắt đầu lúc tám giờ."),
              W("w139", "nine", "/naɪn/", "SỐ ĐẾM", "số chín (9)", "nine o'clock (9 giờ đúng).", "My little brother is nine years old.", "My little brother is ____ years old.", "Em trai tôi chín tuổi."),
              W("w140", "ten", "/ten/", "SỐ ĐẾM", "số mười (10)", "ten stars (mười ngôi sao).", "Count from one to ten!", "Count from one to ____!", "Hãy đếm từ một đến mười nào!")
            ],
            sentences: [
              { vi: "Có bảy ngày trong một tuần.", words: ["There", "are", "seven", "days", "in", "a", "week"] },
              { vi: "Hãy đếm từ một đến mười.", words: ["Count", "from", "one", "to", "ten"] }
            ]
          }
        ]
      },
      {
        id: "vehicles", num: "15", title: "Xe cộ & Giao thông", enTitle: "Vehicles & Transport",
        desc: "Các phương tiện đi lại quen thuộc trên đường phố, trên biển và trên bầu trời.",
        lessons: [
          {
            id: "t15_l1", num: "Bài 01", title: "Phương tiện đường bộ",
            words: [
              W("w141", "car", "/kɑːr/", "DANH TỪ", "xe ô tô", "by car (đi bằng ô tô), drive a car.", "My dad drives a red car.", "My dad drives a red ____.", "Bố tôi lái một chiếc ô tô màu đỏ."),
              W("w142", "bus", "/bʌs/", "DANH TỪ", "xe buýt", "school bus (xe buýt trường học), take the bus.", "I go to school by bus.", "I go to school by ____.", "Tôi đi học bằng xe buýt."),
              W("w143", "bike", "/baɪk/", "DANH TỪ", "xe đạp", "ride a bike (đạp xe đạp). Đầy đủ là 'bicycle'.", "I ride my bike in the park.", "I ride my ____ in the park.", "Tôi đạp xe đạp trong công viên."),
              W("w144", "motorbike", "/ˈmoʊtərbaɪk/", "DANH TỪ", "xe máy", "by motorbike (đi bằng xe máy — rất phổ biến ở VN).", "Many people ride a motorbike.", "Many people ride a ____.", "Rất nhiều người đi xe máy."),
              W("w145", "train", "/treɪn/", "DANH TỪ", "tàu hỏa", "by train / train station (ga tàu).", "The blue train is very fast.", "The blue ____ is very fast.", "Chuyến tàu màu xanh chạy rất nhanh.")
            ],
            sentences: [
              { vi: "Tôi đi học bằng xe buýt.", words: ["I", "go", "to", "school", "by", "bus"] },
              { vi: "Bố tôi lái một chiếc ô tô đỏ.", words: ["My", "dad", "drives", "a", "red", "car"] }
            ]
          },
          {
            id: "t15_l2", num: "Bài 02", title: "Máy bay, Tàu thuyền & An toàn",
            words: [
              W("w146", "plane", "/pleɪn/", "DANH TỪ", "máy bay", "by plane (đi bằng máy bay). Đầy đủ: 'airplane'.", "The plane flies high in the sky.", "The ____ flies high in the sky.", "Máy bay bay cao trên bầu trời."),
              W("w147", "boat", "/boʊt/", "DANH TỪ", "con thuyền", "by boat / a small boat.", "We see a boat on the river.", "We see a ____ on the river.", "Chúng tôi thấy một con thuyền trên sông."),
              W("w148", "truck", "/trʌk/", "DANH TỪ", "xe tải", "a big truck (chiếc xe tải lớn).", "The truck carries fresh fruit.", "The ____ carries fresh fruit.", "Chiếc xe tải chở trái cây tươi."),
              W("w149", "helmet", "/ˈhelmɪt/", "DANH TỪ", "mũ bảo hiểm", "wear a helmet (đội mũ bảo hiểm).", "Always wear a helmet on a bike.", "Always wear a ____ on a bike.", "Luôn đội mũ bảo hiểm khi đi xe nhé."),
              W("w150", "road", "/roʊd/", "DANH TỪ", "con đường", "cross the road (qua đường).", "Look left and right on the road.", "Look left and right on the ____.", "Hãy nhìn trái phải khi qua đường.")
            ],
            sentences: [
              { vi: "Máy bay bay cao trên bầu trời.", words: ["The", "plane", "flies", "high", "in", "the", "sky"] },
              { vi: "Chúng tôi thấy một con thuyền trên sông.", words: ["We", "see", "a", "boat", "on", "the", "river"] }
            ]
          }
        ]
      },
      {
        id: "objects", num: "16", title: "Đồ vật hằng ngày", enTitle: "Everyday Objects",
        desc: "Những đồ dùng quen thuộc trong nhà, trên bàn học và vật dụng mang theo mỗi ngày.",
        lessons: [
          {
            id: "t16_l1", num: "Bài 01", title: "Đồ dùng trong nhà & Bàn ăn",
            words: [
              W("w151", "table", "/ˈteɪbl/", "DANH TỪ", "cái bàn", "on the table (ở trên bàn).", "The book is on the table.", "The book is on the ____.", "Quyển sách nằm ở trên bàn."),
              W("w152", "chair", "/tʃer/", "DANH TỪ", "cái ghế", "sit on a chair (ngồi lên ghế).", "Please sit on this chair.", "Please sit on this ____.", "Mời bạn ngồi lên chiếc ghế này."),
              W("w153", "bed", "/bed/", "DANH TỪ", "cái giường", "go to bed (đi ngủ — không dùng 'the').", "I go to bed at 9 PM.", "I go to ____ at 9 PM.", "Tôi đi ngủ lúc 9 giờ tối."),
              W("w154", "cup", "/kʌp/", "DANH TỪ", "cái cốc, tách", "a cup of tea / a cup of milk.", "She drinks a cup of warm milk.", "She drinks a ____ of warm milk.", "Cô ấy uống một cốc sữa ấm."),
              W("w155", "spoon", "/spuːn/", "DANH TỪ", "cái thìa, muỗng", "a soup spoon (thìa ăn súp).", "I use a spoon to eat soup.", "I use a ____ to eat soup.", "Tôi dùng thìa để ăn súp.")
            ],
            sentences: [
              { vi: "Quyển sách ở trên bàn.", words: ["The", "book", "is", "on", "the", "table"] },
              { vi: "Tôi đi ngủ lúc 9 giờ tối.", words: ["I", "go", "to", "bed", "at", "9", "PM"] }
            ]
          },
          {
            id: "t16_l2", num: "Bài 02", title: "Đồ dùng học tập & Cá nhân",
            words: [
              W("w156", "pen", "/pen/", "DANH TỪ", "cây bút mực", "a blue pen (cây bút xanh).", "Can I borrow your pen?", "Can I borrow your ____?", "Tôi mượn cây bút của bạn được không?"),
              W("w157", "bag", "/bæɡ/", "DANH TỪ", "cái túi, cặp sách", "school bag (cặp đi học).", "Put your books in the bag.", "Put your books in the ____.", "Hãy cất sách vào trong cặp."),
              W("w158", "clock", "/klɑːk/", "DANH TỪ", "đồng hồ (treo tường / để bàn)", "alarm clock (đồng hồ báo thức).", "The clock is on the desk.", "The ____ is on the desk.", "Chiếc đồng hồ nằm trên bàn học."),
              W("w159", "key", "/kiː/", "DANH TỪ", "chìa khóa", "house key (chìa khóa nhà).", "Where is my house key?", "Where is my house ____?", "Chìa khóa nhà của tôi đâu rồi?"),
              W("w160", "umbrella", "/ʌmˈbrelə/", "DANH TỪ", "cái ô, cây dù", "an umbrella (dùng 'an' trước umbrella).", "Take an umbrella when it rains.", "Take an ____ when it rains.", "Hãy mang theo ô khi trời mưa nhé.")
            ],
            sentences: [
              { vi: "Hãy cất sách vào trong cặp.", words: ["Put", "your", "books", "in", "the", "bag"] },
              { vi: "Chìa khóa nhà của tôi đâu rồi?", words: ["Where", "is", "my", "house", "key"] }
            ]
          }
        ]
      }
      ,{
        id: "body", num: "17", title: "Bộ phận cơ thể", enTitle: "Body Parts",
        desc: "Từ vựng về các bộ phận trên cơ thể giúp học sinh mô tả ngoại hình và nói khi đau mỏi.",
        lessons: [
          {
            id: "t17_l1", num: "Bài 01", title: "Khuôn mặt & Đầu",
            words: [
              W("w161", "head", "/hed/", "DANH TỪ", "cái đầu", "shake your head (lắc đầu).", "Wear a hat on your head.", "Wear a hat on your ____.", "Đội mũ lên đầu của bạn nhé."),
              W("w162", "eye", "/aɪ/", "DANH TỪ", "đôi mắt", "two eyes (hai mắt), open your eyes.", "She has big brown eyes.", "She has big brown ____.", "Cô ấy có đôi mắt nâu to."),
              W("w163", "ear", "/ɪr/", "DANH TỪ", "cái tai", "listen with your ears.", "Rabbits have very long ears.", "Rabbits have very long ____.", "Loài thỏ có đôi tai rất dài."),
              W("w164", "mouth", "/maʊθ/", "DANH TỪ", "cái miệng", "Nhớ đặt lưỡi giữa hai răng cho âm cuối /θ/.", "Open your mouth and say ah.", "Open your ____ and say ah.", "Há miệng ra và nói a nào."),
              W("w165", "nose", "/noʊz/", "DANH TỪ", "cái mũi", "smell with your nose.", "I smell flowers with my nose.", "I smell flowers with my ____.", "Tôi ngửi hoa bằng mũi.")
            ],
            sentences: [
              { vi: "Cô ấy có đôi mắt nâu to.", words: ["She", "has", "big", "brown", "eyes"] },
              { vi: "Loài thỏ có đôi tai rất dài.", words: ["Rabbits", "have", "very", "long", "ears"] }
            ]
          },
          {
            id: "t17_l2", num: "Bài 02", title: "Tay, Chân & Trái tim",
            words: [
              W("w166", "hand", "/hænd/", "DANH TỪ", "bàn tay", "wash your hands (rửa tay).", "Wash your hands before eating.", "Wash your ____ before eating.", "Hãy rửa tay trước khi ăn."),
              W("w167", "arm", "/ɑːrm/", "DANH TỪ", "cánh tay", "raise your arm (giơ cánh tay lên).", "Stretch your arms every morning.", "Stretch your ____ every morning.", "Hãy vươn vai duỗi tay mỗi sáng."),
              W("w168", "leg", "/leɡ/", "DANH TỪ", "đôi chân (cẳng chân)", "strong legs (đôi chân khỏe).", "Running makes your legs strong.", "Running makes your ____ strong.", "Chạy bộ giúp đôi chân khỏe mạnh."),
              W("w169", "foot", "/fʊt/", "DANH TỪ", "bàn chân", "Số ít: foot — Số nhiều bất quy tắc: feet.", "Put socks on your feet.", "Put socks on your ____.", "Hãy đi tất vào chân nhé."),
              W("w170", "heart", "/hɑːrt/", "DANH TỪ", "trái tim", "a kind heart (một trái tim nhân hậu).", "She has a very kind heart.", "She has a very kind ____.", "Cô ấy có một trái tim rất nhân hậu.")
            ],
            sentences: [
              { vi: "Hãy rửa tay trước khi ăn.", words: ["Wash", "your", "hands", "before", "eating"] },
              { vi: "Cô ấy có một trái tim nhân hậu.", words: ["She", "has", "a", "very", "kind", "heart"] }
            ]
          }
        ]
      },
      {
        id: "clothes", num: "18", title: "Quần áo & Thời trang", enTitle: "Clothes & Fashion",
        desc: "Các trang phục mặc hằng ngày, đi học, đi làm và phụ kiện thời tiết.",
        lessons: [
          {
            id: "t18_l1", num: "Bài 01", title: "Trang phục cơ bản",
            words: [
              W("w171", "shirt", "/ʃɜːrt/", "DANH TỪ", "áo sơ mi / áo phông", "wear a white shirt (mặc áo trắng).", "I wear a clean white shirt.", "I wear a clean white ____.", "Tôi mặc một chiếc áo trắng sạch sẽ."),
              W("w172", "pants", "/pænts/", "DANH TỪ", "quần dài", "Luôn ở dạng số nhiều (a pair of pants).", "These blue pants fit me well.", "These blue ____ fit me well.", "Chiếc quần xanh này vừa với tôi."),
              W("w173", "dress", "/dres/", "DANH TỪ", "chiếc váy liền", "a pretty dress (chiếc váy xinh).", "She wears a pink dress today.", "She wears a pink ____ today.", "Hôm nay cô ấy mặc một chiếc váy hồng."),
              W("w174", "shoes", "/ʃuːz/", "DANH TỪ", "đôi giày", "take off your shoes (cởi giày ra).", "Please take off your shoes.", "Please take off your ____.", "Vui lòng cởi giày của bạn ra."),
              W("w175", "hat", "/hæt/", "DANH TỪ", "cái mũ, nón", "wear a hat (đội mũ).", "Wear a hat in the hot sun.", "Wear a ____ in the hot sun.", "Hãy đội mũ khi trời nắng nóng.")
            ],
            sentences: [
              { vi: "Vui lòng cởi giày của bạn ra.", words: ["Please", "take", "off", "your", "shoes"] },
              { vi: "Hôm nay cô ấy mặc váy hồng.", words: ["She", "wears", "a", "pink", "dress", "today"] }
            ]
          },
          {
            id: "t18_l2", num: "Bài 02", title: "Áo khoác & Phụ kiện",
            words: [
              W("w176", "jacket", "/ˈdʒækɪt/", "DANH TỪ", "áo khoác", "a warm jacket (chiếc áo khoác ấm).", "Bring a jacket, it is cold.", "Bring a ____, it is cold.", "Mang theo áo khoác nhé, trời lạnh đấy."),
              W("w177", "glasses", "/ˈɡlæsɪz/", "DANH TỪ", "cặp kính mắt", "wear glasses (đeo kính).", "My teacher wears glasses.", "My teacher wears ____.", "Giáo viên của tôi đeo kính."),
              W("w178", "watch", "/wɑːtʃ/", "DANH TỪ", "đồng hồ đeo tay", "a new watch (chiếc đồng hồ mới).", "He looks at his watch.", "He looks at his ____.", "Anh ấy nhìn vào đồng hồ đeo tay."),
              W("w179", "socks", "/sɑːks/", "DANH TỪ", "đôi tất, vớ", "a pair of socks (một đôi tất).", "I need a clean pair of socks.", "I need a clean pair of ____.", "Tôi cần một đôi tất sạch."),
              W("w180", "pocket", "/ˈpɑːkɪt/", "DANH TỪ", "túi quần / túi áo", "in my pocket (trong túi tôi).", "My keys are in my pocket.", "My keys are in my ____.", "Chìa khóa của tôi nằm trong túi.")
            ],
            sentences: [
              { vi: "Giáo viên của tôi đeo kính.", words: ["My", "teacher", "wears", "glasses"] },
              { vi: "Chìa khóa nằm trong túi tôi.", words: ["My", "keys", "are", "in", "my", "pocket"] }
            ]
          }
        ]
      },
      {
        id: "sports", num: "19", title: "Thể thao & Vận động", enTitle: "Sports & Activities",
        desc: "Các môn thể thao phổ biến cho cả học sinh và người lớn rèn luyện sức khỏe.",
        lessons: [
          {
            id: "t19_l1", num: "Bài 01", title: "Các môn thể thao quen thuộc",
            words: [
              W("w181", "football", "/ˈfʊtbɔːl/", "DANH TỪ", "bóng đá", "play football (chơi bóng đá; ở Mỹ gọi là soccer).", "We play football on Sunday.", "We play ____ on Sunday.", "Chúng tôi chơi bóng đá vào Chủ nhật."),
              W("w182", "swimming", "/ˈswɪmɪŋ/", "DANH TỪ", "bơi lội", "go swimming (đi bơi).", "I go swimming in the summer.", "I go ____ in the summer.", "Tôi đi bơi vào mùa hè."),
              W("w183", "running", "/ˈrʌnɪŋ/", "DANH TỪ", "chạy bộ", "go running (đi chạy bộ).", "Running in the park feels great.", "____ in the park feels great.", "Chạy bộ trong công viên thật tuyệt."),
              W("w184", "basketball", "/ˈbæskɪtbɔːl/", "DANH TỪ", "bóng rổ", "play basketball (chơi bóng rổ).", "Students love playing basketball.", "Students love playing ____.", "Học sinh rất thích chơi bóng rổ."),
              W("w185", "tennis", "/ˈtenɪs/", "DANH TỪ", "quần vợt", "play tennis (chơi quần vợt).", "My dad plays tennis every week.", "My dad plays ____ every week.", "Bố tôi chơi quần vợt mỗi tuần.")
            ],
            sentences: [
              { vi: "Chúng tôi chơi bóng đá vào Chủ nhật.", words: ["We", "play", "football", "on", "Sunday"] },
              { vi: "Tôi đi bơi vào mùa hè.", words: ["I", "go", "swimming", "in", "the", "summer"] }
            ]
          },
          {
            id: "t19_l2", num: "Bài 02", title: "Thi đấu & Tinh thần thể thao",
            words: [
              W("w186", "ball", "/bɔːl/", "DANH TỪ", "quả bóng", "kick the ball (đá bóng), catch the ball.", "Pass the ball to me!", "Pass the ____ to me!", "Chuyền bóng cho mình với!"),
              W("w187", "win", "/wɪn/", "ĐỘNG TỪ", "chiến thắng", "win a game (thắng trận; Quá khứ: won).", "Our team wants to win today.", "Our team wants to ____ today.", "Đội chúng tôi muốn thắng hôm nay."),
              W("w188", "lose", "/luːz/", "ĐỘNG TỪ", "thua cuộc / đánh mất", "win or lose (thắng hay thua).", "It is okay to lose sometimes.", "It is okay to ____ sometimes.", "Đôi khi thua cuộc cũng không sao."),
              W("w189", "coach", "/koʊtʃ/", "DANH TỪ", "huấn luyện viên", "a football coach.", "Our coach teaches us well.", "Our ____ teaches us well.", "Huấn luyện viên dạy chúng tôi rất tốt."),
              W("w190", "stadium", "/ˈsteɪdiəm/", "DANH TỪ", "sân vận động", "at the stadium (tại sân vận động).", "The stadium is full of fans.", "The ____ is full of fans.", "Sân vận động chật kín người hâm mộ.")
            ],
            sentences: [
              { vi: "Đội chúng tôi muốn thắng hôm nay.", words: ["Our", "team", "wants", "to", "win", "today"] },
              { vi: "Huấn luyện viên dạy chúng tôi rất tốt.", words: ["Our", "coach", "teaches", "us", "well"] }
            ]
          }
        ]
      },
      {
        id: "emotions", num: "20", title: "Cảm xúc & Tính cách", enTitle: "Emotions & Personality",
        desc: "Cách diễn tả tâm trạng thật và khen ngợi tính cách người khác trong giao tiếp.",
        lessons: [
          {
            id: "t20_l1", num: "Bài 01", title: "Cảm xúc thường gặp",
            words: [
              W("w191", "happy", "/ˈhæpi/", "TÍNH TỪ", "vui vẻ, hạnh phúc", "be happy about... (vui về điều gì).", "I am so happy to see you.", "I am so ____ to see you.", "Tôi rất vui được gặp bạn."),
              W("w192", "sad", "/sæd/", "TÍNH TỪ", "buồn bã", "feel sad (cảm thấy buồn).", "Don't be sad, I am here.", "Don't be ____, I am here.", "Đừng buồn nhé, có tôi ở đây rồi."),
              W("w193", "angry", "/ˈæŋɡri/", "TÍNH TỪ", "tức giận", "be angry with someone.", "Try not to get angry quickly.", "Try not to get ____ quickly.", "Cố gắng đừng nóng giận vội nhé."),
              W("w194", "excited", "/ɪkˈsaɪtɪd/", "TÍNH TỪ", "hào hứng, phấn khích", "be excited about + sự kiện.", "I am excited about the trip.", "I am ____ about the trip.", "Tôi rất hào hứng về chuyến đi."),
              W("w195", "nervous", "/ˈnɜːrvəs/", "TÍNH TỪ", "lo lắng, hồi hộp", "feel nervous before an interview.", "I feel nervous before speaking.", "I feel ____ before speaking.", "Tôi thấy hồi hộp trước khi nói.")
            ],
            sentences: [
              { vi: "Tôi rất vui được gặp bạn.", words: ["I", "am", "so", "happy", "to", "see", "you"] },
              { vi: "Tôi rất hào hứng về chuyến đi.", words: ["I", "am", "excited", "about", "the", "trip"] }
            ]
          },
          {
            id: "t20_l2", num: "Bài 02", title: "Tính cách tích cực",
            words: [
              W("w196", "calm", "/kɑːm/", "TÍNH TỪ", "bình tĩnh", "keep calm (giữ bình tĩnh — chữ 'l' là âm câm).", "Please stay calm and breathe.", "Please stay ____ and breathe.", "Hãy giữ bình tĩnh và hít thở nhé."),
              W("w197", "confident", "/ˈkɑːnfɪdənt/", "TÍNH TỪ", "tự tin", "feel confident (cảm thấy tự tin).", "Practice makes you confident.", "Practice makes you ____.", "Luyện tập giúp bạn trở nên tự tin."),
              W("w198", "honest", "/ˈɑːnɪst/", "TÍNH TỪ", "trung thực, thật thà", "Chữ 'h' đầu là âm câm -> đọc là /ˈɑːnɪst/.", "Everyone trusts an honest person.", "Everyone trusts an ____ person.", "Ai cũng tin tưởng người trung thực."),
              W("w199", "patient", "/ˈpeɪʃnt/", "TÍNH TỪ", "kiên nhẫn", "be patient (hãy kiên nhẫn).", "Be patient when learning English.", "Be ____ when learning English.", "Hãy kiên nhẫn khi học tiếng Anh."),
              W("w200", "proud", "/praʊd/", "TÍNH TỪ", "tự hào", "be proud of + ai đó / điều gì.", "I am very proud of myself.", "I am very ____ of myself.", "Tôi rất tự hào về bản thân mình.")
            ],
            sentences: [
              { vi: "Luyện tập giúp bạn tự tin.", words: ["Practice", "makes", "you", "confident"] },
              { vi: "Tôi rất tự hào về bản thân.", words: ["I", "am", "very", "proud", "of", "myself"] }
            ]
          }
        ]
      },
      {
        id: "house", num: "21", title: "Nhà cửa & Nội thất", enTitle: "House & Rooms",
        desc: "Các phòng trong nhà và đồ nội thất quen thuộc để mô tả không gian sống của bạn.",
        lessons: [
          {
            id: "t21_l1", num: "Bài 01", title: "Các phòng trong nhà",
            words: [
              W("w201", "kitchen", "/ˈkɪtʃɪn/", "DANH TỪ", "nhà bếp", "in the kitchen (trong bếp).", "Mom is cooking in the kitchen.", "Mom is cooking in the ____.", "Mẹ đang nấu ăn trong bếp."),
              W("w202", "bedroom", "/ˈbedruːm/", "DANH TỪ", "phòng ngủ", "my bedroom (phòng ngủ của tôi).", "My bedroom is clean and bright.", "My ____ is clean and bright.", "Phòng ngủ của tôi sạch sẽ và sáng sủa."),
              W("w203", "bathroom", "/ˈbæθruːm/", "DANH TỪ", "phòng tắm / nhà vệ sinh", "Where is the bathroom?", "Excuse me, where is the bathroom?", "Excuse me, where is the ____?", "Cho tôi hỏi nhà vệ sinh ở đâu ạ?"),
              W("w204", "living room", "/ˈlɪvɪŋ ruːm/", "CỤM DANH TỪ", "phòng khách", "in the living room (ở phòng khách).", "We watch TV in the living room.", "We watch TV in the ____.", "Chúng tôi xem TV ở phòng khách."),
              W("w205", "window", "/ˈwɪndoʊ/", "DANH TỪ", "cửa sổ", "open the window (mở cửa sổ).", "Please open the window for fresh air.", "Please open the ____ for fresh air.", "Mở cửa sổ ra cho thoáng khí nhé.")
            ],
            sentences: [
              { vi: "Mẹ đang nấu ăn trong bếp.", words: ["Mom", "is", "cooking", "in", "the", "kitchen"] },
              { vi: "Cho tôi hỏi nhà vệ sinh ở đâu?", words: ["Excuse", "me", "where", "is", "the", "bathroom"] }
            ]
          },
          {
            id: "t21_l2", num: "Bài 02", title: "Đồ nội thất & Tiện nghi",
            words: [
              W("w206", "door", "/dɔːr/", "DANH TỪ", "cánh cửa", "close the door / lock the door.", "Please close the door gently.", "Please close the ____ gently.", "Làm ơn đóng cửa nhẹ tay nhé."),
              W("w207", "mirror", "/ˈmɪrər/", "DANH TỪ", "cái gương", "look in the mirror (soi gương).", "There is a mirror on the wall.", "There is a ____ on the wall.", "Có một chiếc gương trên tường."),
              W("w208", "sofa", "/ˈsoʊfə/", "DANH TỪ", "ghế sô-pha", "sit on the sofa.", "This green sofa is very soft.", "This green ____ is very soft.", "Chiếc ghế sô-pha xanh này rất êm."),
              W("w209", "fridge", "/frɪdʒ/", "DANH TỪ", "tủ lạnh", "Viết gọn của 'refrigerator' — dùng hằng ngày.", "Cold water is in the fridge.", "Cold water is in the ____.", "Nước lạnh ở trong tủ lạnh."),
              W("w210", "balcony", "/ˈbælkəni/", "DANH TỪ", "ban công", "on the balcony (ngoài ban công).", "I grow plants on the balcony.", "I grow plants on the ____.", "Tôi trồng cây ngoài ban công.")
            ],
            sentences: [
              { vi: "Nước lạnh ở trong tủ lạnh.", words: ["Cold", "water", "is", "in", "the", "fridge"] },
              { vi: "Tôi trồng cây ngoài ban công.", words: ["I", "grow", "plants", "on", "the", "balcony"] }
            ]
          }
        ]
      },
      {
        id: "finance", num: "22", title: "Tài chính & Ngân hàng", enTitle: "Finance & Banking",
        desc: "Từ vựng thực tế cho người lớn khi giao dịch ngân hàng, chuyển khoản và quản lý chi tiêu.",
        lessons: [
          {
            id: "t22_l1", num: "Bài 01", title: "Giao dịch ngân hàng cơ bản",
            words: [
              W("w211", "bank", "/bæŋk/", "DANH TỪ", "ngân hàng", "at the bank / bank account.", "I need to go to the bank.", "I need to go to the ____.", "Tôi cần ra ngân hàng."),
              W("w212", "account", "/əˈkaʊnt/", "DANH TỪ", "tài khoản", "open an account (mở tài khoản).", "I want to open a bank account.", "I want to open a bank ____.", "Tôi muốn mở một tài khoản ngân hàng."),
              W("w213", "card", "/kɑːrd/", "DANH TỪ", "thẻ (ngân hàng / tín dụng)", "credit card / debit card.", "Do you accept credit cards?", "Do you accept credit ____?", "Ở đây có nhận thẻ tín dụng không?"),
              W("w214", "cash", "/kæʃ/", "DANH TỪ", "tiền mặt", "pay in cash (trả bằng tiền mặt).", "I prefer to pay in cash.", "I prefer to pay in ____.", "Tôi thích trả bằng tiền mặt hơn."),
              W("w215", "transfer", "/ˈtrænsfɜːr/", "ĐỘNG TỪ / DANH TỪ", "chuyển khoản", "bank transfer (chuyển khoản ngân hàng).", "Can I transfer the money online?", "Can I ____ the money online?", "Tôi chuyển khoản trực tuyến được không?")
            ],
            sentences: [
              { vi: "Tôi muốn mở một tài khoản ngân hàng.", words: ["I", "want", "to", "open", "a", "bank", "account"] },
              { vi: "Tôi thích trả bằng tiền mặt.", words: ["I", "prefer", "to", "pay", "in", "cash"] }
            ]
          },
          {
            id: "t22_l2", num: "Bài 02", title: "Quản lý chi tiêu cá nhân",
            words: [
              W("w216", "save", "/seɪv/", "ĐỘNG TỪ", "tiết kiệm", "save money (tiết kiệm tiền).", "I save ten percent every month.", "I ____ ten percent every month.", "Tôi tiết kiệm 10% mỗi tháng."),
              W("w217", "spend", "/spend/", "ĐỘNG TỪ", "chi tiêu, dành ra", "spend money on... (tiêu tiền vào việc gì).", "Don't spend too much on snacks.", "Don't ____ too much on snacks.", "Đừng tiêu quá nhiều vào đồ ăn vặt."),
              W("w218", "budget", "/ˈbʌdʒɪt/", "DANH TỪ", "ngân sách", "monthly budget (ngân sách hằng tháng).", "We plan our monthly budget carefully.", "We plan our monthly ____ carefully.", "Chúng tôi lập ngân sách tháng rất kỹ."),
              W("w219", "loan", "/loʊn/", "DANH TỪ", "khoản vay", "home loan / bank loan.", "They took a loan to buy a house.", "They took a ____ to buy a house.", "Họ vay một khoản để mua nhà."),
              W("w220", "receipt", "/rɪˈsiːt/", "DANH TỪ", "biên lai, hóa đơn", "Chữ 'p' là âm câm -> đọc là /rɪˈsiːt/.", "Could I have a receipt, please?", "Could I have a ____, please?", "Cho tôi xin biên lai nhé?")
            ],
            sentences: [
              { vi: "Cho tôi xin biên lai nhé.", words: ["Could", "I", "have", "a", "receipt", "please"] },
              { vi: "Tôi tiết kiệm tiền mỗi tháng.", words: ["I", "save", "money", "every", "month"] }
            ]
          }
        ]
      },
      {
        id: "career", num: "23", title: "Phỏng vấn & Sự nghiệp", enTitle: "Career & Interviews",
        desc: "Từ vựng thiết yếu cho người đi làm khi viết CV, đi phỏng vấn và báo cáo dự án.",
        lessons: [
          {
            id: "t23_l1", num: "Bài 01", title: "Xin việc & Phỏng vấn",
            words: [
              W("w221", "resume", "/ˈrezəmeɪ/", "DANH TỪ", "sơ yếu lý lịch (CV)", "send my resume (gửi CV).", "I updated my resume last night.", "I updated my ____ last night.", "Tối qua tôi đã cập nhật lại CV."),
              W("w222", "interview", "/ˈɪntərvjuː/", "DANH TỪ", "buổi phỏng vấn", "job interview (phỏng vấn xin việc).", "I have a job interview tomorrow.", "I have a job ____ tomorrow.", "Ngày mai tôi có buổi phỏng vấn xin việc."),
              W("w223", "experience", "/ɪkˈspɪriəns/", "DANH TỪ", "kinh nghiệm", "work experience (kinh nghiệm làm việc).", "I have three years of experience.", "I have three years of ____.", "Tôi có ba năm kinh nghiệm."),
              W("w224", "skill", "/skɪl/", "DANH TỪ", "kỹ năng", "communication skills (kỹ năng giao tiếp).", "English is a very useful skill.", "English is a very useful ____.", "Tiếng Anh là kỹ năng rất hữu ích."),
              W("w225", "manager", "/ˈmænɪdʒər/", "DANH TỪ", "quản lý, trưởng phòng", "talk to my manager.", "My manager is very fair.", "My ____ is very fair.", "Quản lý của tôi rất công bằng.")
            ],
            sentences: [
              { vi: "Ngày mai tôi có buổi phỏng vấn.", words: ["I", "have", "a", "job", "interview", "tomorrow"] },
              { vi: "Tiếng Anh là kỹ năng rất hữu ích.", words: ["English", "is", "a", "very", "useful", "skill"] }
            ]
          },
          {
            id: "t23_l2", num: "Bài 02", title: "Dự án & Thăng tiến",
            words: [
              W("w226", "project", "/ˈprɑːdʒekt/", "DANH TỪ", "dự án", "start a new project.", "We finished the project on time.", "We finished the ____ on time.", "Chúng tôi hoàn thành dự án đúng hạn."),
              W("w227", "deadline", "/ˈdedlaɪn/", "DANH TỪ", "hạn chót", "meet the deadline (kịp hạn chót).", "The deadline is next Friday.", "The ____ is next Friday.", "Hạn chót là thứ Sáu tuần sau."),
              W("w228", "colleague", "/ˈkɑːliːɡ/", "DANH TỪ", "đồng nghiệp", "work with colleagues.", "My colleagues are very helpful.", "My ____ are very helpful.", "Đồng nghiệp của tôi rất hay giúp đỡ."),
              W("w229", "promotion", "/prəˈmoʊʃn/", "DANH TỪ", "sự thăng chức", "get a promotion (được thăng chức).", "She got a promotion this year.", "She got a ____ this year.", "Năm nay cô ấy được thăng chức."),
              W("w230", "goal", "/ɡoʊl/", "DANH TỪ", "mục tiêu", "career goal (mục tiêu sự nghiệp).", "My goal is to speak English fluently.", "My ____ is to speak English fluently.", "Mục tiêu của tôi là nói tiếng Anh trôi chảy.")
            ],
            sentences: [
              { vi: "Chúng tôi hoàn thành dự án đúng hạn.", words: ["We", "finished", "the", "project", "on", "time"] },
              { vi: "Hạn chót là thứ Sáu tuần sau.", words: ["The", "deadline", "is", "next", "Friday"] }
            ]
          }
        ]
      },
      {
        id: "social", num: "24", title: "Điện thoại & Hẹn gặp", enTitle: "Calls & Appointments",
        desc: "Cách gọi điện, đặt lịch hẹn, xác nhận hoặc dời lịch một cách lịch sự, chuyên nghiệp.",
        lessons: [
          {
            id: "t24_l1", num: "Bài 01", title: "Đặt & Xác nhận lịch hẹn",
            words: [
              W("w231", "call", "/kɔːl/", "ĐỘNG TỪ / DANH TỪ", "gọi điện / cuộc gọi", "call back (gọi lại).", "I will call you back soon.", "I will ____ you back soon.", "Tôi sẽ sớm gọi lại cho bạn."),
              W("w232", "appointment", "/əˈpɔɪntmənt/", "DANH TỪ", "cuộc hẹn", "make an appointment (đặt lịch hẹn).", "I have an appointment at 3 PM.", "I have an ____ at 3 PM.", "Tôi có một cuộc hẹn lúc 3 giờ chiều."),
              W("w233", "confirm", "/kənˈfɜːrm/", "ĐỘNG TỪ", "xác nhận", "confirm the time (xác nhận thời gian).", "Please confirm our meeting time.", "Please ____ our meeting time.", "Vui lòng xác nhận giờ họp của chúng ta."),
              W("w234", "cancel", "/ˈkænsl/", "ĐỘNG TỪ", "hủy bỏ", "cancel a booking / cancel a plan.", "Sorry, I have to cancel today.", "Sorry, I have to ____ today.", "Xin lỗi, hôm nay tôi phải hủy hẹn."),
              W("w235", "reschedule", "/ˌriːˈskedʒuːl/", "ĐỘNG TỪ", "dời lịch sang hôm khác", "reschedule for tomorrow.", "Can we reschedule to Monday?", "Can we ____ to Monday?", "Mình dời lịch sang thứ Hai được không?")
            ],
            sentences: [
              { vi: "Tôi sẽ sớm gọi lại cho bạn.", words: ["I", "will", "call", "you", "back", "soon"] },
              { vi: "Tôi có cuộc hẹn lúc 3 giờ chiều.", words: ["I", "have", "an", "appointment", "at", "3", "PM"] }
            ]
          },
          {
            id: "t24_l2", num: "Bài 02", title: "Mời gặp & Xã giao lịch sự",
            words: [
              W("w236", "address", "/ˈædres/", "DANH TỪ", "địa chỉ", "home address / email address.", "Please send me your address.", "Please send me your ____.", "Vui lòng gửi cho tôi địa chỉ của bạn."),
              W("w237", "invite", "/ɪnˈvaɪt/", "ĐỘNG TỪ", "mời", "invite someone to dinner.", "I want to invite you to dinner.", "I want to ____ you to dinner.", "Tôi muốn mời bạn đi ăn tối."),
              W("w238", "celebrate", "/ˈselɪbreɪt/", "ĐỘNG TỪ", "ăn mừng, kỷ niệm", "celebrate a birthday.", "Let's celebrate your birthday!", "Let's ____ your birthday!", "Hãy cùng ăn mừng sinh nhật bạn nhé!"),
              W("w239", "gift", "/ɡɪft/", "DANH TỪ", "món quà", "a small gift (một món quà nhỏ).", "Thank you for this lovely gift.", "Thank you for this lovely ____.", "Cảm ơn bạn vì món quà đáng yêu này."),
              W("w240", "polite", "/pəˈlaɪt/", "TÍNH TỪ", "lịch sự", "be polite (cư xử lịch sự).", "Always be polite when asking.", "Always be ____ when asking.", "Luôn lịch sự khi hỏi nhé.")
            ],
            sentences: [
              { vi: "Vui lòng gửi cho tôi địa chỉ.", words: ["Please", "send", "me", "your", "address"] },
              { vi: "Cảm ơn vì món quà đáng yêu này.", words: ["Thank", "you", "for", "this", "lovely", "gift"] }
            ]
          }
        ]
      }
    ];

    const ALL_WORDS = [];
    TOPICS_DATA.forEach(t => {
      t.lessons.forEach(l => {
        l.words.forEach(w => {
          ALL_WORDS.push({ ...w, topicId: t.id, topicTitle: t.title, lessonId: l.id, lessonNum: l.num });
        });
      });
    });

    const TOPIC_IMAGES = {
      greeting: "./assets/topics/greeting.jpg",
      education: "./assets/topics/education.jpg",
      family: "./assets/topics/family.jpg",
      work: "./assets/topics/work.jpg",
      food: "./assets/topics/food.jpg",
      shopping: "./assets/topics/shopping.jpg",
      daily: "./assets/topics/daily.jpg",
      travel: "./assets/topics/travel.jpg",
      health: "./assets/topics/health.jpg",
      tech: "./assets/topics/tech.jpg",
      colors: "./assets/topics/colors.jpg",
      animals: "./assets/topics/animals.jpg",
      plants: "./assets/topics/plants.jpg",
      numbers: "./assets/topics/numbers.jpg",
      vehicles: "./assets/topics/vehicles.jpg",
      objects: "./assets/topics/objects.jpg",
      body: "./assets/topics/body.jpg",
      clothes: "./assets/topics/clothes.jpg",
      sports: "./assets/topics/sports.jpg",
      emotions: "./assets/topics/emotions.jpg",
      house: "./assets/topics/house.jpg",
      finance: "./assets/topics/finance.jpg",
      career: "./assets/topics/career.jpg",
      social: "./assets/topics/social.jpg",
    };
    const TOPIC_AUDIENCE = {
      greeting: 'both', education: 'kids', family: 'both', work: 'adult',
      food: 'both', shopping: 'adult', daily: 'both', travel: 'adult',
      health: 'both', tech: 'adult', colors: 'kids', animals: 'kids',
      plants: 'kids', numbers: 'kids', vehicles: 'kids', objects: 'kids',
      body: 'kids', clothes: 'both', sports: 'both', emotions: 'adult',
      house: 'both', finance: 'adult', career: 'adult', social: 'adult'
    };
    const ENABLE_CUSTOM_WORD_IMAGES = true;
    function getWordSlug(en) {
      return String(en || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    function renderWordVisual(word, sizeClass) {
      const topicId = word.topicId || (ALL_WORDS.find(x => x.id === word.id) || {}).topicId || 'greeting';
      const fallback = TOPIC_IMAGES[topicId] || TOPIC_IMAGES.greeting;
      const cls = sizeClass || 'w-52 sm:w-60 aspect-[4/3] rounded-2xl object-cover shadow-sm border-2 border-indigo-100 mx-auto';
      if (!ENABLE_CUSTOM_WORD_IMAGES) {
        return `<img src="${fallback}" alt="${word.en}" class="${cls}" />`;
      }
      const slug = getWordSlug(word.en);
      return `<img src="./assets/words/${slug}.jpg" data-png="./assets/words/${slug}.png" data-fallback="${fallback}" alt="${word.en}" class="${cls}" onerror="if(this.dataset.png){const p=this.dataset.png;this.dataset.png='';this.src=p;}else{this.onerror=null;this.src=this.dataset.fallback;}" />`;
    }

    // ==================== 6 TWO-PERSON BEGINNER DIALOGUES (Hội thoại 2 vai) ====================
    const DIALOGUES_DATA = [
      {
        id: "d1", num: "01", title: "Làm quen lần đầu", level: "A0 · Siêu dễ",
        context: "Minh gặp Anna — một người bạn mới trong lớp tiếng Anh.",
        lines: [
          { role: "A", name: "Anna", en: "Hello! My name is Anna. Nice to meet you.", vi: "Xin chào! Tên mình là Anna. Rất vui được gặp bạn." },
          { role: "B", name: "Bạn (Minh)", en: "Hi Anna! I am Minh. Nice to meet you too.", vi: "Chào Anna! Mình là Minh. Mình cũng rất vui được gặp bạn." },
          { role: "A", name: "Anna", en: "Where are you from, Minh?", vi: "Bạn đến từ đâu vậy Minh?" },
          { role: "B", name: "Bạn (Minh)", en: "I am from Vietnam. I am learning English now.", vi: "Mình đến từ Việt Nam. Bây giờ mình đang học tiếng Anh." }
        ]
      },
      {
        id: "d2", num: "02", title: "Gọi đồ uống ở quán cà phê", level: "A0 · Thực tế",
        context: "Bạn gọi một ly cà phê sữa đá và hỏi giá tiền.",
        lines: [
          { role: "A", name: "Nhân viên", en: "Good morning! What would you like to order?", vi: "Chào buổi sáng! Bạn muốn gọi món gì ạ?" },
          { role: "B", name: "Bạn", en: "Can I have an iced coffee, please?", vi: "Cho mình một ly cà phê đá nhé?" },
          { role: "A", name: "Nhân viên", en: "Sure! Anything else?", vi: "Vâng ạ! Bạn có dùng thêm gì nữa không?" },
          { role: "B", name: "Bạn", en: "No, thank you. How much is it?", vi: "Không, cảm ơn bạn. Của mình bao nhiêu tiền vậy?" }
        ]
      },
      {
        id: "d3", num: "03", title: "Hỏi đường khi đi du lịch", level: "A1 · Du lịch",
        context: "Bạn đang tìm đường đến khách sạn gần đó.",
        lines: [
          { role: "B", name: "Bạn", en: "Excuse me, where is the Central Hotel?", vi: "Xin lỗi, cho tôi hỏi khách sạn Central ở đâu vậy?" },
          { role: "A", name: "Người dân", en: "Go straight ahead, then turn right.", vi: "Bạn cứ đi thẳng về phía trước, rồi rẽ phải." },
          { role: "B", name: "Bạn", en: "Is it far from here?", vi: "Từ đây đến đó có xa không ạ?" },
          { role: "A", name: "Người dân", en: "No, it is about five minutes on foot.", vi: "Không đâu, đi bộ mất khoảng 5 phút thôi." }
        ]
      },
      {
        id: "d4", num: "04", title: "Mua quần áo & Hỏi cỡ", level: "A1 · Mua sắm",
        context: "Bạn muốn thử một chiếc áo cỡ lớn hơn và trả bằng thẻ.",
        lines: [
          { role: "A", name: "Người bán", en: "Can I help you find something?", vi: "Tôi có thể giúp bạn tìm món gì không?" },
          { role: "B", name: "Bạn", en: "Yes, I like this shirt. Do you have a bigger size?", vi: "Có, tôi thích chiếc áo này. Bạn có cỡ lớn hơn không?" },
          { role: "A", name: "Người bán", en: "Yes, here you are. It is on discount today.", vi: "Có ạ, của bạn đây. Hôm nay áo này đang được giảm giá." },
          { role: "B", name: "Bạn", en: "Great! Can I pay by card?", vi: "Tuyệt quá! Tôi có thể thanh toán bằng thẻ không?" }
        ]
      },
      {
        id: "d5", num: "05", title: "Đi khám bác sĩ cơ bản", level: "A1 · Sức khỏe",
        context: "Bạn thấy mệt, đau đầu và trao đổi nhanh với bác sĩ.",
        lines: [
          { role: "A", name: "Bác sĩ", en: "Hello. How are you feeling today?", vi: "Chào bạn. Hôm nay bạn cảm thấy trong người thế nào?" },
          { role: "B", name: "Bạn", en: "I feel tired and I have a headache.", vi: "Tôi cảm thấy mệt và bị đau đầu ạ." },
          { role: "A", name: "Bác sĩ", en: "Take this medicine after meals and get some rest.", vi: "Bạn uống thuốc này sau bữa ăn và nghỉ ngơi nhé." },
          { role: "B", name: "Bạn", en: "Thank you very much, doctor.", vi: "Cảm ơn bác sĩ rất nhiều ạ." }
        ]
      },
      {
        id: "d6", num: "06", title: "Hỏi mật khẩu Wifi ở quán", level: "A0 · Đời sống",
        context: "Bạn cần kết nối internet để làm việc trên máy tính.",
        lines: [
          { role: "B", name: "Bạn", en: "Excuse me, what is the wifi password?", vi: "Cho mình hỏi, mật khẩu wifi là gì vậy ạ?" },
          { role: "A", name: "Nhân viên", en: "It is coffee 2026, all lowercase.", vi: "Là coffee2026, tất cả viết thường ạ." },
          { role: "B", name: "Bạn", en: "Got it! The internet is very fast.", vi: "Mình vào được rồi! Mạng ở đây nhanh quá." },
          { role: "A", name: "Nhân viên", en: "You are welcome. Enjoy your time!", vi: "Không có gì ạ. Chúc bạn làm việc vui vẻ!" }
        ]
      }
    ];

    // ==================== GRAMMAR DATA ====================
    const GRAMMAR_LESSONS = [
      {
        id: "g1", number: "Bài 01", title: "Cấu trúc câu S + V + O & Đại từ",
        summary: "Mọi câu tiếng Anh cơ bản đều đi theo trật tự vàng: Ai đó (S) + Làm gì (V) + Cái gì (O).",
        formulas: [
          { label: "Trật tự câu chuẩn", code: "Chủ ngữ (S) + Động từ (V) + Tân ngữ (O)" },
          { label: "7 Đại từ làm Chủ ngữ", code: "I, You, We, They, He, She, It" }
        ],
        examples: [
          { en: "I love coffee.", vi: "Tôi thích cà phê." },
          { en: "We study English.", vi: "Chúng tôi học tiếng Anh." },
          { en: "They play football.", vi: "Họ chơi bóng đá." }
        ],
        warning: "Người Việt hay thiếu chủ ngữ (ví dụ: 'Trời mưa' phải nói 'It rains', không nói 'Rain').",
        quiz: [
          { q: "Câu nào sắp xếp ĐÚNG trật tự S + V + O?", options: ["Coffee I drink.", "I drink coffee.", "Drink I coffee.", "I coffee drink."], answer: 1, explain: "Chủ ngữ (I) + Động từ (drink) + Tân ngữ (coffee)." },
          { q: "Đại từ nào chỉ 'Cô ấy'?", options: ["He", "They", "She", "We"], answer: 2, explain: "'She' nghĩa là cô ấy." },
          { q: "Chọn câu đúng cho 'Chúng tôi cần nước':", options: ["We need water.", "Us need water.", "Need we water.", "Water need we."], answer: 0, explain: "We + need + water." }
        ]
      },
      {
        id: "g2", number: "Bài 02", title: "Động từ To Be (am / is / are)",
        summary: "Dùng 'To Be' trước tính từ, nghề nghiệp, tuổi tác, cảm xúc hoặc vị trí.",
        formulas: [
          { label: "I đi với am", code: "I am (I'm) + Tính từ / Danh từ" },
          { label: "Số ít đi với is", code: "He / She / It + is" },
          { label: "Số nhiều đi với are", code: "You / We / They + are" }
        ],
        examples: [
          { en: "I am happy today.", vi: "Hôm nay tôi vui." },
          { en: "She is a teacher.", vi: "Cô ấy là một giáo viên." },
          { en: "Are you ready?", vi: "Bạn sẵn sàng chưa?" }
        ],
        warning: "Không bao giờ bỏ quên am/is/are trước tính từ (Sai: 'I tired' -> Đúng: 'I am tired').",
        quiz: [
          { q: "Điền vào chỗ trống: 'My mother ___ very kind.'", options: ["am", "is", "are", "be"], answer: 1, explain: "'My mother' là số ít nên dùng 'is'." },
          { q: "Câu nào viết ĐÚNG ngữ pháp?", options: ["They is students.", "I very tired.", "We are friends.", "She am a doctor."], answer: 2, explain: "'We' đi với 'are'." },
          { q: "Chuyển sang câu hỏi: 'You are from Vietnam.'", options: ["Are you from Vietnam?", "You are from Vietnam?", "Is you from Vietnam?", "Do you are from Vietnam?"], answer: 0, explain: "Đảo 'Are' lên đầu câu." }
        ]
      },
      {
        id: "g3", number: "Bài 03", title: "Thì Hiện tại đơn (Present Simple)",
        summary: "Dùng để nói về thói quen hằng ngày, lịch trình cố định hoặc sự thật hiển nhiên.",
        formulas: [
          { label: "Khẳng định", code: "I/You/We/They + V  |  He/She/It + V(s/es)" },
          { label: "Phủ định", code: "S + don't / doesn't + V(nguyên mẫu)" },
          { label: "Câu hỏi", code: "Do / Does + S + V(nguyên mẫu)?" }
        ],
        examples: [
          { en: "I wake up at 6 AM every day.", vi: "Tôi thức dậy lúc 6 giờ sáng mỗi ngày." },
          { en: "He works in Ho Chi Minh City.", vi: "Anh ấy làm việc ở TP. Hồ Chí Minh." },
          { en: "Do you like tea?", vi: "Bạn có thích trà không?" }
        ],
        warning: "Khi đã mượn 'Does / Doesn't' thì động từ phía sau phải trả về nguyên mẫu.",
        quiz: [
          { q: "Điền động từ đúng: 'She ___ English every night.'", options: ["study", "studies", "studying", "is study"], answer: 1, explain: "'She' -> đổi 'y' thành 'ies': 'studies'." },
          { q: "Chọn câu phủ định đúng: 'Anh ấy không uống cà phê.'", options: ["He not drink coffee.", "He don't drink coffee.", "He doesn't drinks coffee.", "He doesn't drink coffee."], answer: 3, explain: "'doesn't' + động từ nguyên mẫu 'drink'." },
          { q: "Điền từ còn thiếu: '___ you live near here?'", options: ["Are", "Is", "Do", "Does"], answer: 2, explain: "Động từ thường với 'you' -> mượn 'Do'." }
        ]
      },
      {
        id: "g4", number: "Bài 04", title: "Thì Hiện tại tiếp diễn (Present Continuous)",
        summary: "Diễn tả hành động ĐANG xảy ra ngay lúc nói (dấu hiệu: now, right now, at the moment).",
        formulas: [
          { label: "Khẳng định", code: "S + am / is / are + V-ing" },
          { label: "Phủ định", code: "S + am / is / are + not + V-ing" },
          { label: "Câu hỏi", code: "Am / Is / Are + S + V-ing?" }
        ],
        examples: [
          { en: "I am learning English right now.", vi: "Ngay lúc này tôi đang học tiếng Anh." },
          { en: "She is listening to music.", vi: "Cô ấy đang nghe nhạc." },
          { en: "What are you doing?", vi: "Bạn đang làm gì thế?" }
        ],
        warning: "Phải có đủ CẢ HAI phần: (am/is/are) + (V-ing).",
        quiz: [
          { q: "Điền vào chỗ trống: 'Look! It ___ outside.'", options: ["rains", "raining", "is raining", "are raining"], answer: 2, explain: "'Look!' báo hiệu đang diễn ra -> 'is raining'." },
          { q: "Chọn câu đúng cho 'Họ đang ăn trưa':", options: ["They eating lunch.", "They are eating lunch.", "They is eating lunch.", "They are eat lunch."], answer: 1, explain: "They + are + eating." },
          { q: "Câu hỏi đúng cho 'Cô ấy đang làm việc à?'", options: ["Does she working?", "Is she work?", "Is she working?", "Are she working?"], answer: 2, explain: "Đảo 'Is' lên đầu + 'working'." }
        ]
      },
      {
        id: "g5", number: "Bài 05", title: "Thì Quá khứ đơn (Past Simple)",
        summary: "Kể lại sự việc đã xảy ra và kết thúc trong quá khứ (yesterday, last week, ago).",
        formulas: [
          { label: "Khẳng định", code: "S + V-ed (có quy tắc) hoặc V2 (go -> went)" },
          { label: "Phủ định", code: "S + didn't + V(nguyên mẫu)" },
          { label: "Câu hỏi", code: "Did + S + V(nguyên mẫu)?" }
        ],
        examples: [
          { en: "I watched a good movie yesterday.", vi: "Hôm qua tôi đã xem một bộ phim hay." },
          { en: "We went to Da Lat last year.", vi: "Năm ngoái chúng tôi đã đi Đà Lạt." },
          { en: "Did you sleep well last night?", vi: "Đêm qua bạn ngủ ngon không?" }
        ],
        warning: "Sau 'didn't' hoặc 'Did', động từ luôn quay về nguyên mẫu.",
        quiz: [
          { q: "Chọn dạng đúng: 'I ___ my friend yesterday.'", options: ["call", "called", "calling", "calls"], answer: 1, explain: "'yesterday' -> thêm -ed: 'called'." },
          { q: "Quá khứ của động từ 'go' là gì?", options: ["goed", "going", "went", "gone"], answer: 2, explain: "'go' bất quy tắc -> 'went'." },
          { q: "Chọn câu phủ định đúng: 'Hôm qua tôi không đi làm.'", options: ["I didn't went to work.", "I didn't go to work.", "I don't went to work.", "I not go to work."], answer: 1, explain: "Sau 'didn't' dùng nguyên mẫu 'go'." }
        ]
      }
    ];

    // ==================== IPA DATA ====================
    const IPA_DATA = [
      { id: "ipa_ii", symbol: "/iː/", name: "Âm i dài", cat: "vowel", tip: "Miệng căng sang hai bên như đang cười nhẹ, kéo dài âm 'i' khoảng 1 giây.", mistake: "Đọc quá ngắn khiến 'sheep' giống 'ship'.", examples: [{ en: "see", ipa: "/siː/", vi: "nhìn thấy" }, { en: "tea", ipa: "/tiː/", vi: "trà" }, { en: "sheep", ipa: "/ʃiːp/", vi: "con cừu" }] },
      { id: "ipa_i", symbol: "/ɪ/", name: "Âm i ngắn", cat: "vowel", tip: "Thả lỏng môi, phát âm ngắn và dứt khoát giữa chữ 'i' và 'ư'.", mistake: "Đọc kéo dài thành 'i' tiếng Việt.", examples: [{ en: "sit", ipa: "/sɪt/", vi: "ngồi" }, { en: "ship", ipa: "/ʃɪp/", vi: "con tàu" }, { en: "milk", ipa: "/mɪlk/", vi: "sữa" }] },
      { id: "ipa_ae", symbol: "/æ/", name: "Âm e bẹt", cat: "vowel", tip: "Mở rộng miệng như sắp đọc chữ 'a', nhưng phát ra âm 'e' ngắn.", mistake: "Đọc thành 'e' thường khiến 'bad' giống 'bed'.", examples: [{ en: "cat", ipa: "/kæt/", vi: "con mèo" }, { en: "bad", ipa: "/bæd/", vi: "tệ, xấu" }, { en: "happy", ipa: "/ˈhæpi/", vi: "vui vẻ" }] },
      { id: "ipa_e", symbol: "/e/", name: "Âm e ngắn", cat: "vowel", tip: "Mở miệng vừa phải, gần giống chữ 'e' tiếng Việt nhưng ngắn gọn hơn.", mistake: "Nhầm với âm /æ/ mở miệng rộng.", examples: [{ en: "bed", ipa: "/bed/", vi: "cái giường" }, { en: "pen", ipa: "/pen/", vi: "cây bút" }, { en: "friend", ipa: "/frend/", vi: "bạn bè" }] },
      { id: "ipa_uu", symbol: "/uː/", name: "Âm u dài", cat: "vowel", tip: "Chu tròn môi về phía trước, kéo dài âm 'u' mượt mà.", mistake: "Không chu môi đủ sâu nên âm bị bẹt.", examples: [{ en: "food", ipa: "/fuːd/", vi: "đồ ăn" }, { en: "school", ipa: "/skuːl/", vi: "trường học" }, { en: "blue", ipa: "/bluː/", vi: "xanh dương" }] },
      { id: "ipa_u", symbol: "/ʊ/", name: "Âm u ngắn", cat: "vowel", tip: "Môi hơi tròn nhẹ, thả lỏng, đọc rất ngắn giữa 'u' và 'ư'.", mistake: "Đọc kéo dài giống /uː/.", examples: [{ en: "book", ipa: "/bʊk/", vi: "quyển sách" }, { en: "good", ipa: "/ɡʊd/", vi: "tốt" }, { en: "look", ipa: "/lʊk/", vi: "nhìn" }] },
      { id: "ipa_th_unvoiced", symbol: "/θ/", name: "Âm th không rung", cat: "consonant", tip: "Đặt nhẹ đầu lưỡi giữa hai hàm răng rồi thổi hơi ra (cổ họng KHÔNG rung).", mistake: "Đọc thành 'th' tiếng Việt ('thank' thành 'thanh').", examples: [{ en: "thank", ipa: "/θæŋk/", vi: "cảm ơn" }, { en: "think", ipa: "/θɪŋk/", vi: "suy nghĩ" }, { en: "three", ipa: "/θriː/", vi: "số ba" }] },
      { id: "ipa_th_voiced", symbol: "/ð/", name: "Âm th có rung", cat: "consonant", tip: "Đặt đầu lưỡi giữa hai hàm răng và làm RUNG cổ họng.", mistake: "Đọc thành 'đ' hoặc 'd' mà không đưa lưỡi ra.", examples: [{ en: "this", ipa: "/ðɪs/", vi: "cái này" }, { en: "mother", ipa: "/ˈmʌðər/", vi: "mẹ" }, { en: "weather", ipa: "/ˈweðər/", vi: "thời tiết" }] },
      { id: "ipa_sh", symbol: "/ʃ/", name: "Âm s nặng", cat: "consonant", tip: "Chu môi ra trước như ra hiệu 'suỵt!', đẩy hơi nhẹ qua kẽ răng.", mistake: "Đọc thành 's' nhẹ khiến 'she' giống 'see'.", examples: [{ en: "she", ipa: "/ʃiː/", vi: "cô ấy" }, { en: "shop", ipa: "/ʃɑːp/", vi: "cửa hàng" }, { en: "fish", ipa: "/fɪʃ/", vi: "con cá" }] },
      { id: "ipa_ch", symbol: "/tʃ/", name: "Âm ch bật hơi", cat: "consonant", tip: "Chu môi, chạm đầu lưỡi lên vòm miệng trên rồi bật hơi mạnh.", mistake: "Đọc nhẹ như 'ch' tiếng Việt nên thiếu lực bật.", examples: [{ en: "chair", ipa: "/tʃer/", vi: "cái ghế" }, { en: "lunch", ipa: "/lʌntʃ/", vi: "bữa trưa" }, { en: "watch", ipa: "/wɒtʃ/", vi: "xem" }] },
      { id: "ipa_zh", symbol: "/ʒ/", name: "Âm gi rung", cat: "consonant", tip: "Chu môi giống /ʃ/, nhưng rung mạnh cổ họng tạo âm trầm mượt.", mistake: "Hay đọc thành 'd' hoặc 's'.", examples: [{ en: "usually", ipa: "/ˈjuːʒuəli/", vi: "thường xuyên" }, { en: "television", ipa: "/ˈtelɪvɪʒn/", vi: "ti vi" }, { en: "decision", ipa: "/dɪˈsɪʒn/", vi: "quyết định" }] },
      { id: "ipa_dz", symbol: "/dʒ/", name: "Âm j bật rung", cat: "consonant", tip: "Khẩu hình giống /tʃ/ nhưng rung cổ họng khi bật âm.", mistake: "Đọc thành 'gi' nhẹ thiếu lực bật.", examples: [{ en: "job", ipa: "/dʒɑːb/", vi: "công việc" }, { en: "orange", ipa: "/ˈɒrɪndʒ/", vi: "quả cam" }, { en: "enjoy", ipa: "/ɪnˈdʒɔɪ/", vi: "tận hưởng" }] },
      { id: "ipa_r", symbol: "/r/", name: "Âm r cong lưỡi", cat: "consonant", tip: "Chu nhẹ môi, cuộn đầu lưỡi vào trong (KHÔNG chạm vòm miệng trên).", mistake: "Rung lưỡi giống 'r' tiếng Việt.", examples: [{ en: "red", ipa: "/red/", vi: "màu đỏ" }, { en: "rain", ipa: "/reɪn/", vi: "mưa" }, { en: "right", ipa: "/raɪt/", vi: "đúng / phải" }] },
      { id: "ipa_end_s", symbol: "-/s/", name: "Âm cuối s", cat: "ending", tip: "Khép nhẹ răng, xì luồng hơi mảnh ở cuối từ.", mistake: "Quên âm cuối khiến 'nice' thành 'nai'.", examples: [{ en: "nice", ipa: "/naɪs/", vi: "đẹp, tử tế" }, { en: "bus", ipa: "/bʌs/", vi: "xe buýt" }, { en: "books", ipa: "/bʊks/", vi: "những quyển sách" }] },
      { id: "ipa_end_t", symbol: "-/t/", name: "Âm cuối t", cat: "ending", tip: "Chạm đầu lưỡi vào chân răng trên rồi bật nhẹ hơi 't' ở cuối từ.", mistake: "Bỏ âm /t/ làm 'cat' giống 'can'.", examples: [{ en: "hot", ipa: "/hɒt/", vi: "nóng" }, { en: "night", ipa: "/naɪt/", vi: "ban đêm" }, { en: "student", ipa: "/ˈstuːdnt/", vi: "học sinh" }] },
      { id: "ipa_end_d", symbol: "-/d/", name: "Âm cuối d", cat: "ending", tip: "Vị trí lưỡi giống /t/ nhưng nhẹ và có độ rung nhỏ.", mistake: "Bỏ âm cuối khiến người nghe nhầm từ.", examples: [{ en: "good", ipa: "/ɡʊd/", vi: "tốt" }, { en: "food", ipa: "/fuːd/", vi: "thức ăn" }, { en: "cold", ipa: "/kəʊld/", vi: "lạnh" }] }
    ];
