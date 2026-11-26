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
              W("w1", "hello", "/həˈləʊ/", "THÁN TỪ", "xin chào", "Dùng để chào bất kỳ ai, mọi lúc trong ngày.", "Hello, nice to meet you!", "____, nice to meet you!", "Xin chào, rất vui được gặp bạn!"),
              W("w2", "thank you", "/θæŋk juː/", "CỤM TỪ", "cảm ơn bạn", "thank you + for + danh từ / V-ing.", "Thank you for your help.", "____ for your help.", "Cảm ơn bạn đã giúp đỡ."),
              W("w3", "sorry", "/ˈsɒri/", "TÍNH TỪ", "xin lỗi", "I am sorry + lý do.", "I am sorry I am late.", "I am ____ I am late.", "Tôi xin lỗi vì đến muộn."),
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
              W("w19", "homework", "/ˈhəʊmwɜːrk/", "DANH TỪ", "bài tập về nhà", "do homework (không thêm s).", "I do my homework after dinner.", "I do my ____ after dinner.", "Tôi làm bài tập về nhà sau bữa tối."),
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
              W("w32", "office", "/ˈɒfɪs/", "DANH TỪ", "văn phòng", "in an office / at the office.", "My office is near my home.", "My ____ is near my home.", "Văn phòng của tôi gần nhà."),
              W("w33", "company", "/ˈkʌmpəni/", "DANH TỪ", "công ty", "work for a company.", "He works for a big company.", "He works for a big ____.", "Anh ấy làm cho một công ty lớn."),
              W("w34", "meeting", "/ˈmiːtɪŋ/", "DANH TỪ", "cuộc họp", "have a meeting (có cuộc họp).", "We have a meeting at 10 AM.", "We have a ____ at 10 AM.", "Chúng tôi có cuộc họp lúc 10 giờ sáng."),
              W("w35", "job", "/dʒɒb/", "DANH TỪ", "nghề nghiệp, việc làm", "a good job / a new job.", "I like my new job.", "I like my new ____.", "Tôi thích công việc mới của mình.")
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
              W("w42", "coffee", "/ˈkɒfi/", "DANH TỪ", "cà phê", "drink coffee / iced coffee.", "I drink coffee every morning.", "I drink ____ every morning.", "Tôi uống cà phê mỗi sáng."),
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
              W("w56", "shop", "/ʃɒp/", "DANH TỪ", "cửa hàng", "coffee shop / clothes shop.", "There is a shop near here.", "There is a ____ near here.", "Có một cửa hàng gần đây."),
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
              W("w62", "tomorrow", "/təˈmɒrəʊ/", "TRẠNG TỪ", "ngày mai", "see you tomorrow.", "I will call you tomorrow.", "I will call you ____.", "Tôi sẽ gọi cho bạn ngày mai."),
              W("w63", "yesterday", "/ˈjestərdeɪ/", "TRẠNG TỪ", "hôm qua", "Dấu hiệu của thì Quá khứ đơn.", "I met him yesterday.", "I met him ____.", "Tôi đã gặp anh ấy hôm qua."),
              W("w64", "weather", "/ˈweðər/", "DANH TỪ", "thời tiết", "The weather is hot/cold/nice.", "The weather is hot today.", "The ____ is hot today.", "Hôm nay thời tiết nóng."),
              W("w65", "home", "/həʊm/", "DANH TỪ", "nhà, tổ ấm", "go home (không dùng 'to'), at home.", "I go home at 6 PM.", "I go ____ at 6 PM.", "Tôi về nhà lúc 6 giờ chiều.")
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
              W("w74", "hotel", "/həʊˈtel/", "DANH TỪ", "khách sạn", "stay at a hotel / book a hotel.", "Our hotel is near the beach.", "Our ____ is near the beach.", "Khách sạn của chúng tôi gần biển."),
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
              W("w81", "doctor", "/ˈdɒktər/", "DANH TỪ", "bác sĩ", "see a doctor (đi khám bác sĩ).", "You should see a doctor.", "You should see a ____.", "Bạn nên đi khám bác sĩ."),
              W("w82", "hospital", "/ˈhɒspɪtl/", "DANH TỪ", "bệnh viện", "go to the hospital.", "The hospital is on this street.", "The ____ is on this street.", "Bệnh viện nằm trên con đường này."),
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
              W("w90", "strong", "/strɒŋ/", "TÍNH TỪ", "khỏe mạnh, vững chắc", "stay strong / strong body.", "Running makes my body strong.", "Running makes my body ____.", "Chạy bộ giúp cơ thể tôi khỏe mạnh.")
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
              W("w91", "phone", "/fəʊn/", "DANH TỪ", "điện thoại", "phone number / use my phone.", "What is your phone number?", "What is your ____ number?", "Số điện thoại của bạn là gì?"),
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
              W("w98", "photo", "/ˈfəʊtəʊ/", "DANH TỪ", "bức ảnh", "take a photo (chụp ảnh).", "Can you take a photo for me?", "Can you take a ____ for me?", "Bạn chụp giúp tôi một tấm ảnh được không?"),
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
      { id: "ipa_sh", symbol: "/ʃ/", name: "Âm s nặng", cat: "consonant", tip: "Chu môi ra trước như ra hiệu 'suỵt!', đẩy hơi nhẹ qua kẽ răng.", mistake: "Đọc thành 's' nhẹ khiến 'she' giống 'see'.", examples: [{ en: "she", ipa: "/ʃiː/", vi: "cô ấy" }, { en: "shop", ipa: "/ʃɒp/", vi: "cửa hàng" }, { en: "fish", ipa: "/fɪʃ/", vi: "con cá" }] },
      { id: "ipa_ch", symbol: "/tʃ/", name: "Âm ch bật hơi", cat: "consonant", tip: "Chu môi, chạm đầu lưỡi lên vòm miệng trên rồi bật hơi mạnh.", mistake: "Đọc nhẹ như 'ch' tiếng Việt nên thiếu lực bật.", examples: [{ en: "chair", ipa: "/tʃer/", vi: "cái ghế" }, { en: "lunch", ipa: "/lʌntʃ/", vi: "bữa trưa" }, { en: "watch", ipa: "/wɒtʃ/", vi: "xem" }] },
      { id: "ipa_zh", symbol: "/ʒ/", name: "Âm gi rung", cat: "consonant", tip: "Chu môi giống /ʃ/, nhưng rung mạnh cổ họng tạo âm trầm mượt.", mistake: "Hay đọc thành 'd' hoặc 's'.", examples: [{ en: "usually", ipa: "/ˈjuːʒuəli/", vi: "thường xuyên" }, { en: "television", ipa: "/ˈtelɪvɪʒn/", vi: "ti vi" }, { en: "decision", ipa: "/dɪˈsɪʒn/", vi: "quyết định" }] },
      { id: "ipa_dz", symbol: "/dʒ/", name: "Âm j bật rung", cat: "consonant", tip: "Khẩu hình giống /tʃ/ nhưng rung cổ họng khi bật âm.", mistake: "Đọc thành 'gi' nhẹ thiếu lực bật.", examples: [{ en: "job", ipa: "/dʒɒb/", vi: "công việc" }, { en: "orange", ipa: "/ˈɒrɪndʒ/", vi: "quả cam" }, { en: "enjoy", ipa: "/ɪnˈdʒɔɪ/", vi: "tận hưởng" }] },
      { id: "ipa_r", symbol: "/r/", name: "Âm r cong lưỡi", cat: "consonant", tip: "Chu nhẹ môi, cuộn đầu lưỡi vào trong (KHÔNG chạm vòm miệng trên).", mistake: "Rung lưỡi giống 'r' tiếng Việt.", examples: [{ en: "red", ipa: "/red/", vi: "màu đỏ" }, { en: "rain", ipa: "/reɪn/", vi: "mưa" }, { en: "right", ipa: "/raɪt/", vi: "đúng / phải" }] },
      { id: "ipa_end_s", symbol: "-/s/", name: "Âm cuối s", cat: "ending", tip: "Khép nhẹ răng, xì luồng hơi mảnh ở cuối từ.", mistake: "Quên âm cuối khiến 'nice' thành 'nai'.", examples: [{ en: "nice", ipa: "/naɪs/", vi: "đẹp, tử tế" }, { en: "bus", ipa: "/bʌs/", vi: "xe buýt" }, { en: "books", ipa: "/bʊks/", vi: "những quyển sách" }] },
      { id: "ipa_end_t", symbol: "-/t/", name: "Âm cuối t", cat: "ending", tip: "Chạm đầu lưỡi vào chân răng trên rồi bật nhẹ hơi 't' ở cuối từ.", mistake: "Bỏ âm /t/ làm 'cat' giống 'can'.", examples: [{ en: "hot", ipa: "/hɒt/", vi: "nóng" }, { en: "night", ipa: "/naɪt/", vi: "ban đêm" }, { en: "student", ipa: "/ˈstuːdnt/", vi: "học sinh" }] },
      { id: "ipa_end_d", symbol: "-/d/", name: "Âm cuối d", cat: "ending", tip: "Vị trí lưỡi giống /t/ nhưng nhẹ và có độ rung nhỏ.", mistake: "Bỏ âm cuối khiến người nghe nhầm từ.", examples: [{ en: "good", ipa: "/ɡʊd/", vi: "tốt" }, { en: "food", ipa: "/fuːd/", vi: "thức ăn" }, { en: "cold", ipa: "/kəʊld/", vi: "lạnh" }] }
    ];
