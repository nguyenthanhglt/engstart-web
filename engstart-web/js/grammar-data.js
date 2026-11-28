// Kho Ngữ pháp Chuyên sâu Song ngữ Anh (12 chuyên đề A0–B1) & Trung (8 chuyên đề HSK 1–3)
// Mỗi điểm ngữ pháp có: Công thức, Giải thích chi tiết bằng tiếng Việt, 3 ví dụ kèm dịch & phân tích, Lỗi hay mắc, và Câu hỏi kiểm tra nhanh.

window.AIO_GRAMMAR_UNITS_FULL = {
  en: [
    {
      num: 1, group: 'tenses', title: 'Động từ To Be & Đại từ sở hữu', level: 'A0–A1',
      points: [
        {
          title: 'Động từ To Be (am / is / are) — Khẳng định, Phủ định, Câu hỏi',
          formula: '(+) S + am/is/are + N/Adj  |  (-) S + am/is/are + not  |  (?) Am/Is/Are + S + ...?',
          rule: 'Trong tiếng Anh, khi câu KHÔNG có động từ chỉ hành động (ăn, đi, chạy...) mà chỉ mô tả tính chất, nghề nghiệp, tuổi tác, cảm xúc hoặc vị trí thì BẮT BUỘC phải có động từ "to be": I đi với am; He / She / It / Danh từ số ít đi với is; You / We / They / Danh từ số nhiều đi với are.',
          examples: [
            { text: 'I am a student and she is my teacher.', vi: 'Tôi là học sinh còn cô ấy là giáo viên của tôi.', note: 'I đi với "am", She (ngôi 3 số ít) đi với "is".' },
            { text: 'They are not tired today.', vi: 'Hôm nay họ không mệt.', note: 'Phủ định chỉ cần thêm "not" ngay sau "are" (viết tắt: aren’t).' },
            { text: 'Are you ready for class?', vi: 'Bạn đã sẵn sàng vào lớp chưa?', note: 'Câu hỏi chỉ cần đảo "Are" lên đầu câu, không mượn Do/Does.' }
          ],
          mistake: '❌ Sai: "I very happy" hoặc "She not a doctor"  →  ✅ Đúng: "I am very happy" / "She is not a doctor".',
          check: { q: 'Chọn đáp án đúng: "My sister ___ ten years old."', opts: ['am', 'is', 'are', 'be'], ans: 1, explain: '"My sister" (em gái tôi) là danh từ số ít tương đương "she", nên dùng "is".' }
        },
        {
          title: 'Đại từ nhân xưng & Tính từ sở hữu (my, your, his, her, our, their)',
          formula: 'I → my  |  You → your  |  He → his  |  She → her  |  It → its  |  We → our  |  They → their',
          rule: 'Tính từ sở hữu luôn đứng TRƯỚC danh từ để chỉ vật/người đó thuộc về ai. Khác với tiếng Việt (nói "sách của tôi"), tiếng Anh luôn đặt từ sở hữu trước danh từ ("my book").',
          examples: [
            { text: 'This is my backpack and that is his pen.', vi: 'Đây là ba lô của tôi còn kia là cây bút của anh ấy.', note: '"my" đứng trước "backpack", "his" đứng trước "pen".' },
            { text: 'Her dog loves playing in our garden.', vi: 'Chú chó của cô ấy thích chơi trong vườn nhà chúng tôi.', note: 'Dùng "her" cho nữ, "our" cho của chúng tôi.' },
            { text: 'Their house is near the park.', vi: 'Nhà của họ ở gần công viên.', note: 'Dùng "their" cho số nhiều (của họ).' }
          ],
          mistake: '❌ Sai: "Book of me" hoặc "She name is Lan"  →  ✅ Đúng: "My book" / "Her name is Lan".',
          check: { q: 'Điền từ đúng: "Nam is my friend. ___ favorite color is blue."', opts: ['He', 'Him', 'His', 'Her'], ans: 2, explain: 'Trước danh từ "favorite color" cần tính từ sở hữu của Nam (con trai) là "His".' }
        }
      ]
    },
    {
      num: 2, group: 'parts', title: 'Mạo từ (a/an/the), Số nhiều & There is/are', level: 'A1',
      points: [
        {
          title: 'Cách dùng mạo từ a / an / the chuẩn xác',
          formula: 'a / an + N (số ít)  |  the + N',
          rule: 'Dùng "a/an" trước danh từ đếm được số ít khi nhắc tới lần đầu (nghĩa là "một"). Dùng "an" khi âm đầu của từ là nguyên âm (a, e, i, o, u — ví dụ: an apple, an hour). Dùng "the" khi cả người nói và người nghe đều biết rõ đang nói tới vật nào, hoặc vật duy nhất (the sun, the moon).',
          examples: [
            { text: 'I saw a dog. The dog was very cute.', vi: 'Tôi thấy một chú chó. Chú chó đó rất dễ thương.', note: 'Nhắc lần đầu dùng "a dog", nhắc lại lần 2 đã rõ con nào nên dùng "the dog".' },
            { text: 'She eats an orange and an egg every morning.', vi: 'Cô ấy ăn một quả cam và một quả trứng mỗi sáng.', note: '"orange" và "egg" bắt đầu bằng nguyên âm nên dùng "an".' },
            { text: 'The sun rises in the east.', vi: 'Mặt trời mọc ở hướng đông.', note: 'Mặt trời là duy nhất nên luôn dùng "the sun".' }
          ],
          mistake: '❌ Sai: "I have a umbrella" hoặc "He is teacher"  →  ✅ Đúng: "I have an umbrella" / "He is a teacher".',
          check: { q: 'Chọn mạo từ đúng: "My dad bought ___ umbrella yesterday."', opts: ['a', 'an', 'the', 'không cần'], ans: 1, explain: '"umbrella" đọc là /ʌmˈbrelə/ (bắt đầu bằng nguyên âm) và nhắc lần đầu nên dùng "an".' }
        },
        {
          title: 'There is / There are (Có cái gì ở đâu)',
          formula: 'There is + N (số ít / không đếm được)  |  There are + N (số nhiều)',
          rule: 'Khi muốn giới thiệu sự tồn tại của vật hoặc người ở một địa điểm ("Có 1 quyển sách trên bàn"), tiếng Anh dùng "There is / There are", KHÔNG dùng "Have" đứng đầu câu như tiếng Việt.',
          examples: [
            { text: 'There is a red apple on the table.', vi: 'Có một quả táo đỏ ở trên bàn.', note: '1 quả táo (số ít) nên dùng "There is".' },
            { text: 'There are three books in my bag.', vi: 'Có ba quyển sách trong cặp của tôi.', note: '3 quyển sách (số nhiều) nên dùng "There are" và "books" thêm -s.' },
            { text: 'Is there any milk in the fridge?', vi: 'Còn chút sữa nào trong tủ lạnh không?', note: '"milk" không đếm được nên dùng số ít "Is there".' }
          ],
          mistake: '❌ Sai: "Have three people in the room"  →  ✅ Đúng: "There are three people in the room".',
          check: { q: 'Điền từ đúng: "___ two cute cats under the chair."', opts: ['There is', 'There are', 'Have', 'It is'], ans: 1, explain: '"two cute cats" là số nhiều nên bắt buộc dùng "There are".' }
        }
      ]
    },
    {
      num: 3, group: 'tenses', title: 'Thì Hiện tại đơn (Present Simple)', level: 'A1',
      points: [
        {
          title: 'Diễn tả thói quen, lịch trình & sự thật hiển nhiên',
          formula: '(+) I/You/We/They + V  |  He/She/It + V-s/es   •   (-) S + don’t/doesn’t + V nguyên mẫu',
          rule: 'Dùng thì Hiện tại đơn cho những việc lặp đi lặp lại hằng ngày (every day, always, usually, often, sometimes) hoặc sự thật luôn đúng. Đặc biệt lưu ý: với chủ ngữ He / She / It, động từ phải thêm -s (hoặc -es nếu tận cùng là o, s, sh, ch, x, z).',
          examples: [
            { text: 'I wake up at six every morning.', vi: 'Tôi thức dậy lúc 6 giờ mỗi sáng.', note: 'Chủ ngữ "I" nên động từ "wake" giữ nguyên.' },
            { text: 'She watches cartoons after dinner.', vi: 'Cô bé xem phim hoạt hình sau bữa tối.', note: '"watch" kết thúc bằng "ch" và chủ ngữ là "She" nên thêm "-es" thành "watches".' },
            { text: 'He does not like spicy food.', vi: 'Anh ấy không thích đồ ăn cay.', note: 'Đã mượn trợ động từ "does not" (doesn’t) thì động từ "like" trả về nguyên mẫu.' }
          ],
          mistake: '❌ Sai: "She doesn’t likes coffee" hoặc "He go to school"  →  ✅ Đúng: "She doesn’t like coffee" / "He goes to school".',
          check: { q: 'Chọn câu đúng:', opts: ['He play football every Sunday.', 'He plays football every Sunday.', 'He playing football every Sunday.', 'He is play football every Sunday.'], ans: 1, explain: 'Thói quen "every Sunday" dùng Hiện tại đơn; chủ ngữ "He" nên "play" thêm "-s".' }
        },
        {
          title: 'Câu hỏi Yes/No & Wh- với Do / Does',
          formula: '(?) Do + I/you/we/they + V?  |  Does + he/she/it + V?  |  Wh- + do/does + S + V?',
          rule: 'Khi đặt câu hỏi cho động từ thường ở Hiện tại đơn, phải mượn trợ động từ Do hoặc Does đặt trước chủ ngữ, và động từ chính LUÔN ở dạng nguyên mẫu không chia.',
          examples: [
            { text: 'Do you speak English?', vi: 'Bạn có nói tiếng Anh không?', note: 'Chủ ngữ "you" mượn "Do".' },
            { text: 'Does your father work in a hospital?', vi: 'Bố bạn có làm việc ở bệnh viện không?', note: '"your father" là số ít (he) nên mượn "Does", động từ "work" giữ nguyên.' },
            { text: 'Where do they live?', vi: 'Họ sống ở đâu?', note: 'Từ để hỏi "Where" đứng đầu, sau đó tới "do + they + live".' }
          ],
          mistake: '❌ Sai: "Where you live?" hoặc "Does she works here?"  →  ✅ Đúng: "Where do you live?" / "Does she work here?".',
          check: { q: 'Điền trợ động từ đúng: "What time ___ the bus leave?"', opts: ['do', 'does', 'is', 'are'], ans: 1, explain: '"the bus" là số ít (it) và "leave" là động từ thường nên mượn "does".' }
        }
      ]
    },
    {
      num: 4, group: 'tenses', title: 'Thì Hiện tại tiếp diễn (Present Continuous)', level: 'A1',
      points: [
        {
          title: 'Hành động đang xảy ra ngay lúc nói (be + V-ing)',
          formula: '(+) S + am/is/are + V-ing  |  (-) S + am/is/are + not + V-ing  |  (?) Am/Is/Are + S + V-ing?',
          rule: 'Dùng khi hành động ĐANG diễn ra ngay tại thời điểm nói (dấu hiệu: now, right now, at the moment, Look!, Listen!). Nhớ KHÔNG được quên động từ to be (am/is/are) trước V-ing.',
          examples: [
            { text: 'Listen! The birds are singing outside.', vi: 'Nghe kìa! Những chú chim đang hót bên ngoài.', note: 'Có dấu hiệu "Listen!" và "the birds" số nhiều nên dùng "are singing".' },
            { text: 'I am doing my homework right now.', vi: 'Ngay lúc này tôi đang làm bài tập về nhà.', note: 'I + am + doing.' },
            { text: 'She is not sleeping; she is reading a book.', vi: 'Cô ấy không đang ngủ; cô ấy đang đọc sách.', note: 'Phủ định thêm "not" sau "is".' }
          ],
          mistake: '❌ Sai: "I learning English now" (thiếu am)  →  ✅ Đúng: "I am learning English now".',
          check: { q: 'Chọn đáp án đúng: "Look! It ___ outside."', opts: ['rain', 'rains', 'is raining', 'raining'], ans: 2, explain: 'Có từ "Look!" báo hiệu sự việc đang xảy ra ngay lúc nói nên dùng "is raining".' }
        },
        {
          title: 'Phân biệt Hiện tại đơn vs Hiện tại tiếp diễn',
          formula: 'Hiện tại đơn: S + V / V-s,es  |  Hiện tại tiếp diễn: S + am/is/are + V-ing',
          rule: 'Hãy đặt câu hỏi: việc này diễn ra MỖI NGÀY (thói quen) hay ĐANG XẢY RA NGAY BÂY GIỜ? Ngoài ra, các động từ chỉ cảm giác/suy nghĩ (like, love, want, know, understand) thường KHÔNG chia V-ing.',
          examples: [
            { text: 'I usually drink tea, but today I am drinking coffee.', vi: 'Tôi thường uống trà, nhưng hôm nay tôi đang uống cà phê.', note: 'Vế 1 là thói quen ("usually" → drink); vế 2 là tình huống tạm thời hôm nay ("am drinking").' },
            { text: 'She knows the answer.', vi: 'Cô ấy biết câu trả lời.', note: '"know" là động từ trạng thái, không viết "She is knowing".' },
            { text: 'My brother plays tennis on Sundays, and he is playing now.', vi: 'Anh tôi chơi quần vợt vào các Chủ nhật, và giờ anh ấy đang chơi.', note: 'Tách bạch rõ thói quen với hành động hiện tại.' }
          ],
          mistake: '❌ Sai: "I am liking ice cream"  →  ✅ Đúng: "I like ice cream".',
          check: { q: 'Điền dạng đúng: "Every day he ___ to school, but today he is taking the bus."', opts: ['walk', 'walks', 'is walking', 'walked'], ans: 1, explain: '"Every day" là thói quen hằng ngày, chủ ngữ "he" nên dùng Hiện tại đơn "walks".' }
        }
      ]
    },
    {
      num: 5, group: 'tenses', title: 'Thì Quá khứ đơn & Quá khứ tiếp diễn', level: 'A1–A2',
      points: [
        {
          title: 'Thì Quá khứ đơn (Past Simple: V-ed / V2 & did)',
          formula: '(+) S + V-ed / V2  |  (-) S + didn’t + V nguyên mẫu  |  (?) Did + S + V nguyên mẫu?',
          rule: 'Dùng để kể chuyện đã xảy ra và chấm dứt hẳn trong quá khứ (yesterday, last week, two days ago, in 2020). Với to be dùng was (I/he/she/it) và were (you/we/they). Với động từ thường: thêm -ed (play → played) hoặc dùng cột 2 bất quy tắc (go → went, eat → ate, see → saw).',
          examples: [
            { text: 'We visited Da Lat last summer.', vi: 'Mùa hè năm ngoái chúng tôi đã đi thăm Đà Lạt.', note: '"visit" có quy tắc nên thêm "-ed" thành "visited".' },
            { text: 'He went to the zoo and saw two elephants.', vi: 'Cậu ấy đã đi sở thú và thấy hai con voi.', note: '"go → went" và "see → saw" là động từ bất quy tắc.' },
            { text: 'Did you finish your homework yesterday?', vi: 'Hôm qua bạn có làm xong bài tập không?', note: 'Đã mượn "Did" thì động từ "finish" giữ nguyên mẫu, KHÔNG thêm "-ed".' }
          ],
          mistake: '❌ Sai: "I didn’t went to school" hoặc "Did you ate?"  →  ✅ Đúng: "I didn’t go to school" / "Did you eat?".',
          check: { q: 'Chọn đáp án đúng: "Yesterday, Mom ___ a delicious cake."', opts: ['make', 'makes', 'made', 'making'], ans: 2, explain: '"Yesterday" là quá khứ đơn; quá khứ bất quy tắc của "make" là "made".' }
        },
        {
          title: 'Quá khứ tiếp diễn kết hợp When / While',
          formula: 'S + was/were + V-ing + WHEN + S + V-ed/V2',
          rule: 'Dùng Quá khứ tiếp diễn (was/were + V-ing) để diễn tả hành động ĐANG diễn ra tại một thời điểm trong quá khứ, thì một hành động khác bất ngờ xen ngang (chia Quá khứ đơn).',
          examples: [
            { text: 'I was reading a book when the phone rang.', vi: 'Tôi đang đọc sách thì điện thoại reo.', note: 'Đọc sách đang diễn ra (was reading), chuông reo xen vào (rang).' },
            { text: 'While Mom was cooking, Dad was washing the car.', vi: 'Trong khi mẹ đang nấu ăn thì bố đang rửa xe.', note: 'Hai hành động diễn ra song song cùng lúc nên cả hai đều chia was/were + V-ing.' },
            { text: 'At 8 p.m. last night, we were watching a movie.', vi: 'Lúc 8 giờ tối qua, chúng tôi đang xem phim.', note: 'Có giờ cụ thể trong quá khứ (at 8 p.m. last night) dùng Quá khứ tiếp diễn.' }
          ],
          mistake: '❌ Sai: "When I was walk home, I saw him"  →  ✅ Đúng: "When I was walking home, I saw him".',
          check: { q: 'Điền đúng: "She ___ dinner when I arrived."', opts: ['cooks', 'cooked', 'was cooking', 'is cooking'], ans: 2, explain: 'Hành động nấu ăn đang diễn ra thì "I arrived" xen vào nên dùng "was cooking".' }
        }
      ]
    },
    {
      num: 6, group: 'tenses', title: 'Thì Tương lai (Will vs Be going to)', level: 'A1–A2',
      points: [
        {
          title: 'Will + V nguyên mẫu: Quyết định tức thì, lời hứa & dự đoán',
          formula: '(+) S + will (’ll) + V  |  (-) S + will not (won’t) + V  |  (?) Will + S + V?',
          rule: 'Dùng "will + V nguyên mẫu" khi bạn vừa mới nảy ra quyết định ngay lúc nói, đưa ra lời hứa, lời đề nghị giúp đỡ, hoặc dự đoán theo cảm tính (I think it will rain).',
          examples: [
            { text: 'The bag looks heavy. I will help you carry it!', vi: 'Cái túi trông nặng quá. Để tôi giúp bạn xách nhé!', note: 'Quyết định giúp đỡ ngay tại thời điểm nói → dùng "will".' },
            { text: 'I promise I won’t be late tomorrow.', vi: 'Tôi hứa ngày mai tôi sẽ không đi muộn đâu.', note: 'Lời hứa dùng "will / won’t".' },
            { text: 'I think Vietnam will win the match.', vi: 'Tôi nghĩ Việt Nam sẽ thắng trận đấu.', note: 'Dự đoán theo quan điểm cá nhân (I think...) dùng "will".' }
          ],
          mistake: '❌ Sai: "He will goes tomorrow" hoặc "I will to call you"  →  ✅ Đúng: "He will go tomorrow" / "I will call you".',
          check: { q: 'Chọn câu đúng:', opts: ['She will visits us next week.', 'She will visit us next week.', 'She wills visit us next week.', 'She will visiting us next week.'], ans: 1, explain: 'Sau "will" động từ LUÔN ở dạng nguyên mẫu không thêm s/ed/ing.' }
        },
        {
          title: 'Be going to + V: Dự định đã lên kế hoạch trước',
          formula: 'S + am / is / are + going to + V nguyên mẫu',
          rule: 'Dùng "be going to + V" khi bạn ĐÃ có dự định, kế hoạch từ trước lúc nói, hoặc dự đoán dựa trên dấu hiệu thấy rõ trước mắt (mây đen kéo đến → sắp mưa).',
          examples: [
            { text: 'We are going to visit our grandparents this weekend.', vi: 'Cuối tuần này nhà mình dự định đi thăm ông bà.', note: 'Đã bàn bạc lên kế hoạch trước → dùng "are going to visit".' },
            { text: 'Look at those dark clouds! It is going to rain.', vi: 'Nhìn mấy đám mây đen kìa! Trời sắp mưa rồi.', note: 'Có bằng chứng rõ ràng trước mắt (mây đen) → dùng "is going to rain".' },
            { text: 'What are you going to do tonight?', vi: 'Tối nay bạn định làm gì?', note: 'Hỏi về kế hoạch đã dự tính.' }
          ],
          mistake: '❌ Sai: "I going to buy a bike" (thiếu am)  →  ✅ Đúng: "I am going to buy a bike".',
          check: { q: 'Hoàn thành câu: "Look at the dark sky! It ___ rain soon."', opts: ['is going to', 'going to', 'are going to', 'was going to'], ans: 0, explain: 'Dự đoán có dấu hiệu rõ ràng trước mắt + chủ ngữ "It" → "is going to".' }
        }
      ]
    },
    {
      num: 7, group: 'tenses', title: 'Thì Hiện tại hoàn thành (Present Perfect)', level: 'A2',
      points: [
        {
          title: 'Kinh nghiệm & hành động kéo dài đến hiện tại (have/has + V3)',
          formula: '(+) S + have/has + V3/V-ed  |  (-) S + haven’t/hasn’t + V3  |  (?) Have/Has + S + V3?',
          rule: 'Dùng Hiện tại hoàn thành để nói về trải nghiệm ("đã từng làm gì", không nêu rõ thời gian cụ thể), việc vừa mới xong (just, already, yet), hoặc việc bắt đầu từ quá khứ và VẪN tiếp tục tới hiện tại (for + khoảng thời gian, since + mốc thời gian).',
          examples: [
            { text: 'I have lived in Ho Chi Minh City for five years.', vi: 'Tôi đã sống ở TP.HCM được 5 năm rồi.', note: 'Bắt đầu sống từ 5 năm trước và hiện tại vẫn đang sống → dùng "have lived" + "for 5 years".' },
            { text: 'She has just finished her lunch.', vi: 'Cô ấy vừa mới ăn trưa xong.', note: 'Chủ ngữ "She" dùng "has"; "just" (vừa mới) đặt giữa "has" và "finished".' },
            { text: 'Have you ever been to Japan?', vi: 'Bạn đã bao giờ đi Nhật Bản chưa?', note: 'Hỏi về trải nghiệm trong đời dùng "Have you ever + V3".' }
          ],
          mistake: '❌ Sai: "I have lived here since 5 years"  →  ✅ Đúng: "for 5 years" (khoảng thời gian) hoặc "since 2021" (mốc thời gian).',
          check: { q: 'Chọn từ đúng: "He has studied English ___ 2022."', opts: ['for', 'since', 'ago', 'in'], ans: 1, explain: '"2022" là một mốc thời gian bắt đầu nên đi với "since" (còn khoảng thời gian như "4 years" đi với "for").' }
        }
      ]
    },
    {
      num: 8, group: 'parts', title: 'Giới từ (in/on/at) & Từ chỉ số lượng', level: 'A1–A2',
      points: [
        {
          title: 'Quy tắc tam giác ngược: IN – ON – AT (Thời gian & Địa điểm)',
          formula: 'IN  >  ON  >  AT',
          rule: 'Nhớ mẹo "từ lớn đến nhỏ": IN dùng cho khoảng rộng (in 2026, in May, in Vietnam, in the room); ON dùng cho ngày/thứ và bề mặt (on Monday, on June 1st, on the table); AT dùng cho giờ chính xác và địa điểm cụ thể (at 7 o’clock, at school, at the door).',
          examples: [
            { text: 'The class starts at 8:00 a.m. on Monday.', vi: 'Lớp học bắt đầu lúc 8 giờ sáng thứ Hai.', note: 'Giờ cụ thể dùng "at 8:00 a.m.", thứ trong tuần dùng "on Monday".' },
            { text: 'My birthday is in October.', vi: 'Sinh nhật của tôi vào tháng Mười.', note: 'Tháng (không kèm ngày) dùng "in".' },
            { text: 'The keys are on the desk in the bedroom.', vi: 'Chìa khóa đang ở trên bàn trong phòng ngủ.', note: 'Trên bề mặt dùng "on the desk", bên trong không gian dùng "in the bedroom".' }
          ],
          mistake: '❌ Sai: "in Monday", "at the morning"  →  ✅ Đúng: "on Monday", "in the morning", "at night".',
          check: { q: 'Điền giới từ đúng: "We usually go swimming ___ Sunday."', opts: ['in', 'on', 'at', 'to'], ans: 1, explain: 'Các thứ trong tuần (Monday, Sunday...) luôn dùng giới từ "on".' }
        },
        {
          title: 'Some / Any / Much / Many / A lot of',
          formula: 'some  |  any  |  many + N (số nhiều)  |  much + N (không đếm được)',
          rule: 'Dùng "many" với danh từ đếm được (many books, many friends); dùng "much" với danh từ không đếm được (much water, much time); còn "a lot of" dùng được cho CẢ HAI rất tiện lợi trong giao tiếp!',
          examples: [
            { text: 'I have some apples, but I don’t have any bananas.', vi: 'Tôi có vài quả táo, nhưng tôi không có quả chuối nào.', note: 'Câu khẳng định dùng "some", câu phủ định dùng "any".' },
            { text: 'How many students are there in your class?', vi: 'Có bao nhiêu học sinh trong lớp bạn?', note: '"students" đếm được số nhiều nên hỏi "How many".' },
            { text: 'How much water do you drink every day?', vi: 'Mỗi ngày bạn uống bao nhiêu nước?', note: '"water" không đếm được nên hỏi "How much".' }
          ],
          mistake: '❌ Sai: "How much friends do you have?"  →  ✅ Đúng: "How many friends do you have?".',
          check: { q: 'Điền từ đúng: "There isn’t ___ sugar in the cup."', opts: ['some', 'any', 'many', 'a'], ans: 1, explain: 'Câu phủ định ("isn’t") và "sugar" không đếm được nên dùng "any".' }
        }
      ]
    },
    {
      num: 9, group: 'tenses', title: 'Động từ khuyết thiếu (Can, Could, Should, Must)', level: 'A2',
      points: [
        {
          title: 'Can / Could / Should / Must / Have to',
          formula: 'S + can / could / should / must + V',
          rule: 'Can: khả năng (biết làm gì) hoặc xin phép. Could: lịch sự hơn Can khi nhờ vả. Should: lời khuyên ("nên làm gì"). Must / Have to: bắt buộc, nghĩa vụ ("phải làm gì"). Lưu ý: mustn’t = CẤM làm, còn don’t have to = KHÔNG CẦN phải làm.',
          examples: [
            { text: 'She can swim very well, and she can ride a bike.', vi: 'Cô bé biết bơi rất giỏi và biết đi xe đạp.', note: 'Sau "can" động từ "swim / ride" giữ nguyên mẫu dù chủ ngữ là "She".' },
            { text: 'You should eat more vegetables and sleep early.', vi: 'Bạn nên ăn nhiều rau và ngủ sớm.', note: '"should" dùng để khuyên nhẹ nhàng.' },
            { text: 'You must wear a helmet when riding a motorbike.', vi: 'Bạn phải đội mũ bảo hiểm khi đi xe máy.', note: 'Quy định bắt buộc dùng "must".' }
          ],
          mistake: '❌ Sai: "You should to rest" hoặc "He cans swim"  →  ✅ Đúng: "You should rest" / "He can swim".',
          check: { q: 'Chọn câu đúng:', opts: ['You should to drink warm water.', 'You should drinking warm water.', 'You should drink warm water.', 'You shoulds drink warm water.'], ans: 2, explain: 'Sau động từ khuyết thiếu "should" luôn dùng động từ nguyên mẫu không "to".' }
        }
      ]
    },
    {
      num: 10, group: 'parts', title: 'So sánh bằng, So sánh hơn & So sánh nhất', level: 'A2',
      points: [
        {
          title: 'So sánh hơn (-er / more ... than) & So sánh nhất (the -est / the most)',
          formula: 'Adj ngắn: -er than / the -est  |  Adj dài: more ... than / the most ...',
          rule: 'So sánh giữa 2 người/vật dùng So sánh hơn (luôn có "than"). So sánh từ 3 người/vật trở lên dùng So sánh nhất (luôn có "the"). Nhớ 3 từ bất quy tắc hay gặp: good → better → the best; bad → worse → the worst; far → farther → the farthest.',
          examples: [
            { text: 'My brother is taller than me.', vi: 'Anh trai tôi cao hơn tôi.', note: '"tall" là tính từ ngắn (1 âm tiết) nên thêm "-er" + "than".' },
            { text: 'This book is more interesting than that movie.', vi: 'Cuốn sách này thú vị hơn bộ phim kia.', note: '"interesting" là tính từ dài nên dùng "more ... than".' },
            { text: 'That is the best pho restaurant in town.', vi: 'Đó là quán phở ngon nhất trong thị trấn.', note: 'So sánh nhất của "good" là "the best".' }
          ],
          mistake: '❌ Sai: "more better", "the most tallest"  →  ✅ Đúng: "better", "the tallest" (không dùng kép more + -er).',
          check: { q: 'Chọn đáp án đúng: "An elephant is ___ than a rabbit."', opts: ['big', 'bigger', 'more big', 'the biggest'], ans: 1, explain: '"big" là tính từ ngắn có "than" nên gấp đôi phụ âm cuối thành "bigger".' }
        }
      ]
    },
    {
      num: 11, group: 'structures', title: 'Câu điều kiện (If) & Câu bị động cơ bản', level: 'A2–B1',
      points: [
        {
          title: 'Câu điều kiện loại 1 (Điều có thể xảy ra) & loại 2 (Giả định)',
          formula: 'Loại 1: If + S + HTĐ, S + will/can + V  |  Loại 2: If + S + V-ed/V2 (were), S + would + V',
          rule: 'Dùng Loại 1 cho tình huống hoàn toàn có thể xảy ra ở hiện tại/tương lai. Dùng Loại 2 để tưởng tượng điều trái ngược hiện tại (ví dụ: "Nếu tôi có cánh...", "Nếu tôi là bạn...").',
          examples: [
            { text: 'If it rains tomorrow, we will stay at home.', vi: 'Nếu ngày mai trời mưa, chúng ta sẽ ở nhà.', note: 'Mệnh đề "If" chia Hiện tại đơn ("rains"), vế chính chia "will + V".' },
            { text: 'If you study hard, you will pass the exam.', vi: 'Nếu bạn học chăm chỉ, bạn sẽ đậu kỳ thi.', note: 'Điều kiện có thật ở tương lai → Loại 1.' },
            { text: 'If I were you, I would take that job.', vi: 'Nếu tôi là bạn, tôi sẽ nhận công việc đó.', note: 'Giả định không có thật → Loại 2 (dùng "were" cho mọi ngôi).' }
          ],
          mistake: '❌ Sai: "If it will rain, I stay home"  →  ✅ Đúng: "If it rains, I will stay home" (vế If KHÔNG dùng will).',
          check: { q: 'Hoàn thành câu điều kiện loại 1: "If she ___ early, she will catch the bus."', opts: ['leave', 'leaves', 'will leave', 'left'], ans: 1, explain: 'Trong mệnh đề If của câu điều kiện loại 1, chia Hiện tại đơn ("she leaves").' }
        },
        {
          title: 'Câu bị động cơ bản (Passive Voice: be + V3)',
          formula: 'S + am/is/are/was/were + V3/V-ed (+ by O)',
          rule: 'Dùng câu bị động khi muốn nhấn mạnh ĐỐI TƯỢNG chịu hành động (hoặc không cần biết ai làm). Công thức cốt lõi chỉ cần nhớ: To Be (chia theo thì) + Động từ cột 3 (V3/V-ed).',
          examples: [
            { text: 'English is spoken all over the world.', vi: 'Tiếng Anh được nói trên khắp thế giới.', note: 'Bị động hiện tại: "is" + V3 của speak là "spoken".' },
            { text: 'This house was built in 1995.', vi: 'Ngôi nhà này được xây vào năm 1995.', note: 'Bị động quá khứ: "was" + V3 của build là "built".' },
            { text: 'The cake was made by my mom.', vi: 'Chiếc bánh được làm bởi mẹ tôi.', note: 'Thêm "by + người thực hiện" khi muốn nêu rõ ai làm.' }
          ],
          mistake: '❌ Sai: "The letter was write yesterday"  →  ✅ Đúng: "The letter was written yesterday" (nhớ chia V3).',
          check: { q: 'Chọn câu bị động đúng: "Coffee ___ in Gia Lai."', opts: ['grows', 'is grown', 'is grow', 'growing'], ans: 1, explain: 'Cà phê "được trồng" (bị động hiện tại) → "is" + V3 của grow là "grown".' }
        }
      ]
    },
    {
      num: 12, group: 'structures', title: 'V-ing vs To V & Mệnh đề quan hệ (who/which)', level: 'A2–B1',
      points: [
        {
          title: 'Khi nào dùng V-ing và khi nào dùng To V?',
          formula: 'enjoy / love / like / finish / avoid + V-ing   |   want / need / decide / hope / plan + to V',
          rule: 'Khi có 2 động từ đứng liền nhau, động từ thứ 2 phải chia dạng V-ing hoặc to V tùy theo động từ thứ 1. Mẹo nhớ: nhóm chỉ sở thích & kết thúc (enjoy, finish, keep, mind) đi với V-ing; nhóm chỉ mong muốn & dự định (want, hope, decide, promise) đi với to V.',
          examples: [
            { text: 'I enjoy listening to English songs.', vi: 'Tôi rất thích nghe nhạc tiếng Anh.', note: 'Sau "enjoy" luôn dùng V-ing ("listening").' },
            { text: 'She wants to become a doctor.', vi: 'Cô ấy muốn trở thành bác sĩ.', note: 'Sau "want" luôn dùng "to V" ("to become").' },
            { text: 'We decided to go to the beach.', vi: 'Chúng tôi đã quyết định đi biển.', note: 'Sau "decide" dùng "to V".' }
          ],
          mistake: '❌ Sai: "I enjoy to play games" hoặc "I want going home"  →  ✅ Đúng: "I enjoy playing games" / "I want to go home".',
          check: { q: 'Điền dạng đúng: "My kids enjoy ___ cartoons on weekends."', opts: ['watch', 'to watch', 'watching', 'watched'], ans: 2, explain: 'Sau động từ "enjoy" bắt buộc dùng V-ing → "watching".' }
        },
        {
          title: 'Mệnh đề quan hệ đơn giản (who / which / that)',
          formula: 'Người + who / that + V...   |   Vật / Con vật + which / that + V...',
          rule: 'Dùng "who" (cho người) và "which" (cho vật/con vật) để nối 2 câu ngắn thành 1 câu mượt mà, giải thích rõ thêm cho danh từ đứng ngay trước nó. Từ "that" có thể thay cho cả who và which trong câu thông thường.',
          examples: [
            { text: 'The girl who is wearing a red dress is my sister.', vi: 'Cô bé đang mặc váy đỏ là em gái tôi.', note: 'Chỉ người ("The girl") nên dùng "who".' },
            { text: 'This is the book which helped me learn English.', vi: 'Đây là cuốn sách đã giúp tôi học tiếng Anh.', note: 'Chỉ vật ("the book") nên dùng "which".' },
            { text: 'I love the puppy that lives next door.', vi: 'Tôi rất thích chú cún sống ở nhà bên cạnh.', note: 'Dùng "that" thay thế rất tự nhiên trong văn nói.' }
          ],
          mistake: '❌ Sai: "The man which lives here"  →  ✅ Đúng: "The man who lives here" (người không dùng which).',
          check: { q: 'Chọn từ nối đúng: "The teacher ___ teaches us English is very friendly."', opts: ['which', 'who', 'where', 'what'], ans: 1, explain: '"The teacher" là người nên dùng đại từ quan hệ "who".' }
        },
        {
          title: 'Đại từ sở hữu whose & Trạng từ quan hệ (where / when / why)',
          formula: 'whose + N  |  where  |  when  |  why',
          rule: 'Ngoài who/which/that, khi muốn nối câu chỉ sự SỞ HỮU dùng "whose + N"; chỉ NƠI CHỐN dùng "where"; chỉ THỜI GIAN dùng "when"; chỉ LÝ DO (sau "the reason") dùng "why".',
          examples: [
            { text: 'That is the boy whose dog won the prize.', vi: 'Đó là cậu bé có chú chó đã giành giải thưởng.', note: '"whose dog" = chú chó của cậu bé đó.' },
            { text: 'This is the park where we play every Sunday.', vi: 'Đây là công viên nơi chúng tôi chơi mỗi Chủ nhật.', note: 'Chỉ nơi chốn ("the park") dùng "where".' },
            { text: 'I still remember the day when we first met.', vi: 'Tôi vẫn nhớ ngày mà chúng ta gặp nhau lần đầu.', note: 'Chỉ thời gian ("the day") dùng "when".' }
          ],
          mistake: '❌ Sai: "The house where I bought"  →  ✅ Đúng: "The house which/that I bought" (vì buy cần tân ngữ), còn "The house where I live" thì đúng.',
          check: { q: 'Điền từ đúng: "This is the school ___ my mom used to teach."', opts: ['who', 'where', 'when', 'whose'], ans: 1, explain: '"the school" là nơi chốn ("ở đó mẹ tôi từng dạy") nên dùng trạng từ quan hệ "where".' }
        }
      ]
    },
    {
      num: 13, group: 'structures', title: 'Câu mệnh lệnh, yêu cầu & rủ rê (Imperatives)', level: 'A1–A2',
      points: [
        {
          title: 'Câu mệnh lệnh khẳng định, phủ định (Don’t + V) & rủ rê (Let’s + V)',
          formula: '(+) V!  |  (-) Don’t + V!  |  Please + V  |  Let’s + V!',
          rule: 'Câu mệnh lệnh dùng để hướng dẫn, yêu cầu, nhắc nhở hoặc rủ rê — điểm đặc biệt là KHÔNG cần viết chủ ngữ "You" ở đầu câu mà bắt đầu thẳng bằng động từ nguyên mẫu. Muốn lịch sự hơn, thêm "Please" ở đầu hoặc cuối câu.',
          examples: [
            { text: 'Open your book and read page ten, please.', vi: 'Làm ơn mở sách ra và đọc trang 10 nhé.', note: 'Bắt đầu thẳng bằng động từ nguyên mẫu "Open", thêm "please" cho lịch sự.' },
            { text: 'Don’t run near the swimming pool!', vi: 'Đừng chạy gần hồ bơi nhé!', note: 'Cấm đoán / nhắc nhở dùng "Don’t + V nguyên mẫu".' },
            { text: 'Let’s play a vocabulary game together!', vi: 'Chúng ta hãy cùng chơi trò chơi từ vựng nhé!', note: '"Let’s + V" dùng để rủ rê thân mật.' }
          ],
          mistake: '❌ Sai: "Not touch that!" hoặc "Let’s to go!"  →  ✅ Đúng: "Don’t touch that!" / "Let’s go!".',
          check: { q: 'Câu nhắc nhở nào viết ĐÚNG ngữ pháp?', opts: ['No talk in class!', 'Not talk in class!', 'Don’t talk in class!', 'Doesn’t talk in class!'], ans: 2, explain: 'Câu mệnh lệnh phủ định luôn dùng "Don’t + V nguyên mẫu" → "Don’t talk in class!".' }
        }
      ]
    },
    {
      num: 14, group: 'tenses', title: 'Tổng hợp Trợ động từ (Do / Be / Have)', level: 'A1–A2',
      points: [
        {
          title: 'Phân biệt nhanh Do/Does/Did · Am/Is/Are · Have/Has',
          formula: 'Do/Does/Did + V  |  Be + V-ing / V3 / Adj  |  Have/Has + V3',
          rule: 'Trợ động từ giống như "người phụ tá" giúp đặt câu hỏi, phủ định và chia thì. Quy tắc vàng không bao giờ nhầm: thấy động từ thường ở Hiện tại đơn/Quá khứ đơn → mượn Do/Does/Did; thấy V-ing, bị động hoặc tính từ → dùng Be (am/is/are/was/were); thấy V3 (đã từng/vừa xong) → dùng Have/Has.',
          examples: [
            { text: 'Do you like apples? — Yes, I do.', vi: 'Bạn có thích táo không? — Có, mình thích.', note: '"like" là động từ thường ở Hiện tại đơn → mượn "Do".' },
            { text: 'Are you watching TV right now?', vi: 'Bạn đang xem TV ngay bây giờ à?', note: 'Có V-ing ("watching") → dùng trợ động từ "Are".' },
            { text: 'Have they finished their project yet?', vi: 'Họ đã làm xong dự án chưa?', note: 'Có V3 ("finished") + "yet" → dùng "Have".' }
          ],
          mistake: '❌ Sai: "Are you like coffee?" (nhầm to be với động từ thường)  →  ✅ Đúng: "Do you like coffee?".',
          check: { q: 'Điền trợ động từ đúng: "___ she go to the party last night?"', opts: ['Do', 'Does', 'Did', 'Was'], ans: 2, explain: '"last night" là quá khứ đơn và "go" là động từ thường nguyên mẫu → mượn "Did".' }
        }
      ]
    },
    {
      num: 15, group: 'parts', title: 'Danh từ & Bảng 5 cột Đại từ đầy đủ', level: 'A1–A2',
      points: [
        {
          title: 'Đủ 5 cột Đại từ: Chủ ngữ · Tân ngữ · Sở hữu · Phản thân',
          formula: 'I / me / my / mine / myself  •  He / him / his / his / himself  •  She / her / her / hers / herself  •  They / them / their / theirs / themselves',
          rule: 'Chủ ngữ đứng TRƯỚC động từ (I love you). Tân ngữ đứng SAU động từ hoặc giới từ (She gave me a gift). Đại từ sở hữu (mine, yours, hers) đứng MỘT MÌNH thay cho "my + N". Đại từ phản thân (myself, yourself) dùng khi chủ ngữ tự làm việc đó cho chính mình.',
          examples: [
            { text: 'Please give him the book; it is his.', vi: 'Làm ơn đưa cuốn sách cho anh ấy; nó là của anh ấy.', note: '"him" là tân ngữ đứng sau "give"; "his" đứng độc lập thay cho "his book".' },
            { text: 'This red bag is mine, not yours.', vi: 'Cái túi đỏ này là của tôi, không phải của bạn.', note: '"mine" = my bag, "yours" = your bag.' },
            { text: 'My little son can tie his shoes by himself.', vi: 'Con trai nhỏ của tôi có thể tự buộc dây giày.', note: '"by himself" = tự một mình cậu bé làm.' }
          ],
          mistake: '❌ Sai: "She told I a story" hoặc "This pen is my"  →  ✅ Đúng: "She told me a story" / "This pen is mine".',
          check: { q: 'Chọn đại từ đúng: "That blue bike is ___."', opts: ['my', 'me', 'mine', 'I'], ans: 2, explain: 'Đứng một mình cuối câu (không có danh từ theo sau) phải dùng đại từ sở hữu "mine".' }
        },
        {
          title: 'Danh từ đếm được & Danh từ không đếm được',
          formula: 'Đếm được: a/an + N, N-s/es  |  Không đếm được: N',
          rule: 'Danh từ không đếm được (chất lỏng, chất bột, khái niệm trừu tượng như water, milk, money, advice, homework, news) LUÔN chia động từ số ít (is/has) và muốn đếm phải mượn đơn vị (a glass of water, a piece of advice).',
          examples: [
            { text: 'Could I have a glass of water, please?', vi: 'Cho tôi xin một ly nước được không?', note: '"water" không đếm được, mượn đơn vị "a glass of".' },
            { text: 'My teacher gave me some helpful advice.', vi: 'Cô giáo đã cho tôi vài lời khuyên hữu ích.', note: '"advice" không đếm được nên KHÔNG thêm "-s" (không nói advices).' },
            { text: 'The news is very exciting today.', vi: 'Tin tức hôm nay thật hào hứng.', note: '"news" có chữ -s nhưng là danh từ không đếm được số ít → đi với "is".' }
          ],
          mistake: '❌ Sai: "two informations", "many homeworks"  →  ✅ Đúng: "some information", "a lot of homework".',
          check: { q: 'Chọn câu ĐÚNG ngữ pháp:', opts: ['I have many homeworks today.', 'I have a lot of homework today.', 'I have a homework today.', 'My homeworks are easy.'], ans: 1, explain: '"homework" là danh từ không đếm được → không dùng a/many và không thêm -s.' }
        }
      ]
    },
    {
      num: 16, group: 'parts', title: 'Tính từ & Trạng từ (Adjectives vs Adverbs)', level: 'A1–A2',
      points: [
        {
          title: 'Phân biệt Tính từ (tả người/vật) và Trạng từ (tả cách làm hành động)',
          formula: 'Adj + N  |  V + Adv',
          rule: 'Tính từ mô tả DANH TỪ hoặc đứng sau to be / feel / look (She is happy). Trạng từ mô tả ĐỘNG TỪ ("làm như thế nào?") và thường tạo bằng cách thêm "-ly" vào tính từ (slow → slowly, careful → carefully). Nhớ 3 ngoại lệ kinh điển: good → well, fast giữ nguyên fast, hard giữ nguyên hard.',
          examples: [
            { text: 'He is a careful driver. He always drives carefully.', vi: 'Anh ấy là một tài xế cẩn thận. Anh ấy luôn lái xe cẩn thận.', note: '"careful" (tính từ) bổ nghĩa cho "driver"; "carefully" (trạng từ) bổ nghĩa cho "drives".' },
            { text: 'She speaks English very well.', vi: 'Cô ấy nói tiếng Anh rất giỏi.', note: 'Trạng từ của "good" là "well" (không nói "speaks good").' },
            { text: 'The cheetah runs very fast.', vi: 'Con báo chạy rất nhanh.', note: '"fast" vừa là tính từ vừa là trạng từ — không có từ "fastly"!' }
          ],
          mistake: '❌ Sai: "He runs fastly" hoặc "She sings very good"  →  ✅ Đúng: "He runs fast" / "She sings very well".',
          check: { q: 'Điền từ đúng: "Please listen ___ to the teacher."', opts: ['careful', 'carefully', 'care', 'caring'], ans: 1, explain: 'Cần trạng từ bổ nghĩa cho động từ "listen" (lắng nghe như thế nào?) → "carefully".' }
        }
      ]
    },
    {
      num: 17, group: 'structures', title: 'Từ nối trong câu & Từ nối giữa các câu', level: 'A2–B1',
      points: [
        {
          title: 'Liên từ nối trong câu (and, but, or, so, because, although)',
          formula: 'because / so  |  but / although  |  and / or',
          rule: 'Dùng để nối 2 vế trong cùng 1 câu. Lưu ý cực quan trọng cho người Việt: trong tiếng Anh KHÔNG BAO GIỜ dùng kép "Because ... so ..." hay "Although ... but ..." trong cùng 1 câu (chỉ chọn 1 trong 2 từ thôi!).',
          examples: [
            { text: 'I stayed home because it was raining.', vi: 'Tôi ở nhà vì trời đang mưa.', note: 'Hoặc nói: "It was raining, so I stayed home." (chỉ dùng 1 từ because HOẶC so).' },
            { text: 'Although he was tired, he finished his homework.', vi: 'Mặc dù cậu ấy mệt, cậu ấy vẫn làm xong bài tập.', note: 'Đã dùng "Although" ở đầu câu thì KHÔNG thêm "but" ở vế sau.' },
            { text: 'Would you like tea or orange juice?', vi: 'Bạn muốn uống trà hay nước cam?', note: '"or" dùng để đưa ra lựa chọn.' }
          ],
          mistake: '❌ Sai: "Although it rained, but we went out"  →  ✅ Đúng: "Although it rained, we went out" hoặc "It rained, but we went out".',
          check: { q: 'Chọn câu viết ĐÚNG ngữ pháp tiếng Anh:', opts: ['Because I was late, so I took a taxi.', 'Although she is young, but she is smart.', 'Although she is young, she is very smart.', 'Because it cold, so I wear a coat.'], ans: 2, explain: 'Tiếng Anh không dùng cặp Because...so hay Although...but cùng lúc trong 1 câu.' }
        },
        {
          title: 'Từ nối giữa các câu (However, Therefore, First, Then, Finally)',
          formula: 'Câu 1. However, Câu 2.  |  Câu 1. Therefore, Câu 2.  |  First, ... Then, ... Finally, ...',
          rule: 'Khi muốn chuyển ý mượt mà sang câu tiếp theo trong bài nói hoặc đoạn văn, đặt từ nối ở đầu câu mới và nhớ đặt DẤU PHẨY ngay sau nó (However, / Therefore, / In addition, / Finally,).',
          examples: [
            { text: 'The test was difficult. However, Lan got a high score.', vi: 'Bài kiểm tra rất khó. Tuy nhiên, Lan vẫn đạt điểm cao.', note: '"However," đứng đầu câu mới để chuyển sang ý trái ngược.' },
            { text: 'It rained heavily. Therefore, the football match was canceled.', vi: 'Trời mưa rất to. Vì vậy, trận bóng đá đã bị hủy.', note: '"Therefore," nêu kết quả của câu trước.' },
            { text: 'First, wash your hands. Then, sit down. Finally, enjoy your meal!', vi: 'Đầu tiên hãy rửa tay. Sau đó ngồi xuống. Cuối cùng, chúc ngon miệng!', note: 'Chuỗi First → Then → Finally kể trình tự cực dễ nhớ cho cả bé và người lớn.' }
          ],
          mistake: '❌ Sai: Quên dấu phẩy sau However / Therefore  →  ✅ Đúng: "However, ..." / "Therefore, ...".',
          check: { q: 'Điền từ nối phù hợp: "He studied very hard. ___, he passed the test easily."', opts: ['However', 'Therefore', 'Although', 'But'], ans: 1, explain: 'Câu sau là KẾT QUẢ của câu trước ("vì vậy") nên dùng "Therefore".' }
        }
      ]
    }
  ],
  zh: [
    {
      num: 1, group: 'structures', title: 'Câu chữ 是 (shì) & Câu hỏi 吗 (ma)', level: 'HSK 1',
      points: [
        {
          title: 'Câu định nghĩa A 是 B (A là B) & Phủ định 不是',
          formula: '(+) A + 是 + B  |  (-) A + 不是 + B  |  (?) A + 是 + B + 吗？',
          rule: 'Chữ 是 (shì) dùng để nối 2 danh từ (nghĩa là "là"). Lưu ý quan trọng: tiếng Trung KHÔNG dùng 是 trước tính từ (ví dụ: "Cô ấy rất đẹp" nói 她很漂亮, KHÔNG nói 她是漂亮!). Phủ định của 是 là 不是 (đọc biến điệu thành bú shì).',
          examples: [
            { text: '我是越南人。', pinyin: 'Wǒ shì Yuènán rén.', vi: 'Tôi là người Việt Nam.', note: 'Nối đại từ 我 với danh từ 越南人 bằng 是.' },
            { text: '他不是老师，他是医生。', pinyin: 'Tā bú shì lǎoshī, tā shì yīshēng.', vi: 'Anh ấy không phải giáo viên, anh ấy là bác sĩ.', note: 'Phủ định thêm 不 trước 是, đọc là bú shì.' },
            { text: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', vi: 'Bạn là học sinh phải không?', note: 'Chỉ cần thêm 吗 (ma) vào cuối câu trần thuật là thành câu hỏi Có/Không.' }
          ],
          mistake: '❌ Sai: "我很高兴" viết thành "我是高兴"  →  ✅ Đúng: "我很高兴" (trước tính từ dùng 很, không dùng 是).',
          check: { q: 'Câu nào dịch ĐÚNG cho "Tôi rất vui"?', opts: ['我是高兴。', '我很高兴。', '我有高兴。', '我高兴吗。'], ans: 1, explain: 'Trước tính từ 高兴 (vui) dùng phó từ 很, KHÔNG dùng 是.' }
        },
        {
          title: 'Các từ để hỏi cơ bản (什么, 谁, 哪儿, 几, 多少)',
          formula: 'S + V + [什么 / 谁 / 哪儿 / 几 / 多少]?',
          rule: 'Đây là điểm siêu dễ của tiếng Trung so với tiếng Anh: bạn KHÔNG cần đảo ngữ! Muốn hỏi phần nào thì đặt từ để hỏi (什么 cái gì, 谁 ai, 哪儿 ở đâu, 几 mấy) vào đúng vị trí của câu trả lời.',
          examples: [
            { text: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', vi: 'Bạn tên là gì?', note: 'Trả lời: 我叫小明 (thay 什么名字 bằng tên).' },
            { text: '他是谁？', pinyin: 'Tā shì shéi?', vi: 'Anh ấy là ai?', note: '谁 (shéi) đứng ngay vị trí câu trả lời.' },
            { text: '这个多少钱？', pinyin: 'Zhège duōshao qián?', vi: 'Cái này bao nhiêu tiền?', note: '多少钱 (duōshao qián) dùng hỏi giá tiền hằng ngày.' }
          ],
          mistake: '❌ Sai: Thêm 吗 vào câu đã có từ để hỏi ("你叫什么名字吗？")  →  ✅ Đúng: "你叫什么名字？" (không thêm 吗).',
          check: { q: 'Câu hỏi "Bạn ăn gì?" nói thế nào cho đúng?', opts: ['你吃什么吗？', '什么你吃？', '你吃什么？', '你什么吃？'], ans: 2, explain: 'Giữ nguyên trật tự S + V + O ("你 + 吃 + 什么？") và không thêm 吗.' }
        }
      ]
    },
    {
      num: 2, group: 'parts', title: 'Sở hữu 的 (de), Động từ 有 & Lượng từ', level: 'HSK 1',
      points: [
        {
          title: 'Trợ từ sở hữu 的 (của) & Động từ 有 / 没有',
          formula: 'A + 的 + N  |  A + 有 / 没有 + B',
          rule: 'Đặt 的 ở giữa để chỉ sở hữu (ngược với tiếng Việt: "sách của tôi" → 我的书). Khi nói về người thân hoặc mối quan hệ rất gần (我妈妈, 我朋友) có thể lược bỏ 的. Đặc biệt: phủ định của 有 LUÔN là 没有 (méiyǒu), tuyệt đối không dùng 不有.',
          examples: [
            { text: '这是我的书包。', pinyin: 'Zhè shì wǒ de shūbāo.', vi: 'Đây là cặp sách của tôi.', note: '我 (tôi) + 的 (của) + 书包 (cặp sách).' },
            { text: '我有一个弟弟。', pinyin: 'Wǒ yǒu yí gè dìdi.', vi: 'Tôi có một người em trai.', note: 'Dùng 有 (có) + số từ 一 + lượng từ 个.' },
            { text: '今天我没有时间。', pinyin: 'Jīntiān wǒ méiyǒu shíjiān.', vi: 'Hôm nay tôi không có thời gian.', note: 'Phủ định của 有 là 没有.' }
          ],
          mistake: '❌ Sai: "我不有钱"  →  ✅ Đúng: "我没有钱" (Tôi không có tiền).',
          check: { q: 'Phủ định đúng của "我有猫" (Tôi có mèo) là gì?', opts: ['我不有猫', '我没有猫', '我不是猫', '我没是猫'], ans: 1, explain: 'Phủ định của động từ 有 bắt buộc dùng 没有.' }
        },
        {
          title: 'Lượng từ bắt buộc (个, 本, 杯, 只)',
          formula: 'Số từ + Lượng từ + N',
          rule: 'Trong tiếng Trung, giữa số đếm (一, 两, 三...) và danh từ BẮT BUỘC có lượng từ. Nhớ 4 lượng từ hay dùng nhất: 个 (gè — người/đồ vật chung), 本 (běn — sách vở), 杯 (bēi — ly/cốc nước), 只 (zhī — động vật nhỏ). Lưu ý: số 2 trước lượng từ dùng 两 (liǎng), không dùng 二.',
          examples: [
            { text: '我要两杯牛奶。', pinyin: 'Wǒ yào liǎng bēi niúnǎi.', vi: 'Cho tôi hai ly sữa.', note: 'Số 2 đi với lượng từ 杯 phải dùng 两 (liǎng).' },
            { text: '桌子上有三本书。', pinyin: 'Zhuōzi shàng yǒu sān běn shū.', vi: 'Trên bàn có ba quyển sách.', note: 'Lượng từ của sách (书) là 本 (běn).' },
            { text: '我家有一只小狗。', pinyin: 'Wǒ jiā yǒu yì zhī xiǎogǒu.', vi: 'Nhà tôi có một chú cún nhỏ.', note: 'Động vật nhỏ (chó, mèo, chim) dùng lượng từ 只 (zhī).' }
          ],
          mistake: '❌ Sai: "二个人" hoặc "一书"  →  ✅ Đúng: "两个人" / "一本书".',
          check: { q: 'Cụm từ "hai quyển sách" nói thế nào cho chuẩn?', opts: ['二书', '两书', '二本书', '两本书'], ans: 3, explain: 'Số 2 trước lượng từ dùng 两 và lượng từ của sách là 本 → 两本书.' }
        }
      ]
    },
    {
      num: 3, group: 'structures', title: 'Trật tự Thời gian & Địa điểm (在 zài)', level: 'HSK 1',
      points: [
        {
          title: 'Quy tắc vàng: Chủ ngữ + Thời gian + 在 Địa điểm + Động từ',
          formula: 'S + Thời gian + 在 + Địa điểm + V + O',
          rule: 'Khác hẳn tiếng Việt ("Tôi ăn cơm ở nhà"), trong tiếng Trung ĐỊA ĐIỂM (ở đâu) và THỜI GIAN (khi nào) luôn phải đặt TRƯỚC động từ! Hãy nhớ câu thần chú: "Ai — Khi nào — Ở đâu — Làm gì".',
          examples: [
            { text: '我今天在家学习中文。', pinyin: 'Wǒ jīntiān zài jiā xuéxí Zhōngwén.', vi: 'Hôm nay tôi học tiếng Trung ở nhà.', note: '我 (Ai) + 今天 (Khi nào) + 在家 (Ở đâu) + 学习中文 (Làm gì).' },
            { text: '他上午在学校上课。', pinyin: 'Tā shàngwǔ zài xuéxiào shàngkè.', vi: 'Buổi sáng cậu ấy học trên lớp ở trường.', note: '在学校 đứng ngay trước động từ 上课.' },
            { text: '我们在公园散步。', pinyin: 'Wǒmen zài gōngyuán sànbù.', vi: 'Chúng tôi đi dạo ở công viên.', note: 'Không nói 我们散步在公园!' }
          ],
          mistake: '❌ Sai: "我学习中文在家" (dịch từng chữ theo tiếng Việt)  →  ✅ Đúng: "我在家学习中文".',
          check: { q: 'Câu nào đúng trật tự tiếng Trung cho "Tôi ăn cơm ở nhà hàng"?', opts: ['我吃饭在饭馆。', '我在饭馆吃饭。', '在饭馆吃饭我。', '我饭馆在吃饭。'], ans: 1, explain: 'Cụm địa điểm "在饭馆" (ở nhà hàng) phải đặt TRƯỚC động từ "吃饭".' }
        }
      ]
    },
    {
      num: 4, group: 'tenses', title: 'Động từ năng nguyện (想 / 要 / 会 / 能 / 可以)', level: 'HSK 1–2',
      points: [
        {
          title: 'Phân biệt 想 (muốn nhẹ), 要 (muốn / gọi món) và 会 (biết kỹ năng)',
          formula: 'S + 想 / 要 / 会 / 可以 + V',
          rule: '想 (xiǎng): mong muốn trong lòng ("tôi muốn đi du lịch"). 要 (yào): muốn dứt khoát hoặc dùng khi gọi món/mua hàng ("cho tôi 1 ly trà"). 会 (huì): biết một kỹ năng đã qua học tập (biết nói tiếng Trung, biết bơi). 可以 (kěyǐ): xin phép ("có thể không?").',
          examples: [
            { text: '我想去中国旅游。', pinyin: 'Wǒ xiǎng qù Zhōngguó lǚyóu.', vi: 'Tôi muốn đi du lịch Trung Quốc.', note: 'Mong muốn nhẹ nhàng dùng 想.' },
            { text: '我要一杯冰咖啡。', pinyin: 'Wǒ yào yì bēi bīng kāfēi.', vi: 'Cho tôi một ly cà phê đá.', note: 'Gọi đồ ăn/uống dùng 要 rất tự nhiên.' },
            { text: '我会说一点儿汉语。', pinyin: 'Wǒ huì shuō yìdiǎnr Hànyǔ.', vi: 'Tôi biết nói một chút tiếng Trung.', note: 'Kỹ năng học được dùng 会.' }
          ],
          mistake: '❌ Sai: Phủ định của 要 là 不要 (đừng/không muốn) khi khuyên cấm; phủ định của 想 là 不想.',
          check: { q: 'Muốn nói "Tôi biết bơi" (kỹ năng học được), dùng từ nào?', opts: ['想', '会', '是', '在'], ans: 1, explain: 'Kỹ năng phải học mới biết được (bơi, lái xe, nói ngoại ngữ) dùng 会.' }
        }
      ]
    },
    {
      num: 5, group: 'tenses', title: 'Trợ từ 了 (le) & 过 (guo)', level: 'HSK 1–2',
      points: [
        {
          title: 'Trợ từ 了 (đã xảy ra / thay đổi) & 过 (đã từng trải nghiệm)',
          formula: 'S + V + 了 + O  |  S + 没 + V  |  S + V + 过 + O',
          rule: 'Đặt 了 ngay sau động từ để nhấn mạnh hành động đã hoàn thành, hoặc đặt cuối câu để báo sự thay đổi mới ("Trời mưa rồi!"). Khi phủ định quá khứ dùng 没 (méi) và BỎ 了. Dùng 过 (guo) sau động từ để nói kinh nghiệm "đã từng" làm gì trong đời.',
          examples: [
            { text: '我买了一本新书。', pinyin: 'Wǒ mǎile yì běn xīn shū.', vi: 'Tôi đã mua một quyển sách mới.', note: '了 đặt sau động từ 买 chỉ việc mua đã hoàn thành.' },
            { text: '下雨了，我们回家吧！', pinyin: 'Xiàyǔ le, wǒmen huíjiā ba!', vi: 'Trời mưa rồi, chúng ta về nhà thôi!', note: '了 cuối câu báo trạng thái mới thay đổi (từ tạnh sang mưa).' },
            { text: '我去过北京两次。', pinyin: 'Wǒ qùguo Běijīng liǎng cì.', vi: 'Tôi đã từng đi Bắc Kinh hai lần.', note: 'Trải nghiệm đã từng dùng 去过.' }
          ],
          mistake: '❌ Sai: "我没买了书" (vừa có 没 vừa có 了)  →  ✅ Đúng: "我没买书" (đã có 没 thì bỏ 了).',
          check: { q: 'Phủ định đúng của "我吃了早饭" (Tôi đã ăn sáng rồi) là gì?', opts: ['我没吃了早饭', '我不吃了早饭', '我没吃早饭', '我吃没早饭'], ans: 2, explain: 'Phủ định hành động quá khứ dùng 没 + V và phải bỏ 了 → 我没吃早饭.' }
        }
      ]
    },
    {
      num: 6, group: 'structures', title: 'Đang diễn ra (正在...呢) & Câu so sánh 比 (bǐ)', level: 'HSK 2',
      points: [
        {
          title: 'Hành động đang diễn ra (正在 / 在 + V + 呢) & So sánh hơn (A 比 B + Tính từ)',
          formula: 'S + 正在 / 在 + V (+ O) + 呢  |  A + 比 + B + Adj',
          rule: 'Dùng 在 hoặc 正在 trước động từ (có thể thêm 呢 ở cuối câu) để nói việc đang xảy ra. Trong câu so sánh hơn A 比 B + Tính từ: TUYỆT ĐỐI KHÔNG thêm 很 (rất) trước tính từ! Nếu muốn nói "hơn nhiều" dùng 得多, "hơn một chút" dùng 一点儿 đặt SAU tính từ.',
          examples: [
            { text: '妹妹正在画画呢。', pinyin: 'Mèimei zhèngzài huàhuà ne.', vi: 'Em gái đang vẽ tranh đấy.', note: '正在 + V + 呢 diễn tả hành động đang diễn ra.' },
            { text: '今天比昨天冷得多。', pinyin: 'Jīntiān bǐ zuótiān lěng de duō.', vi: 'Hôm nay lạnh hơn hôm qua nhiều.', note: '冷 (lạnh) + 得多 (hơn nhiều), không dùng 很.' },
            { text: '哥哥比我高一点儿。', pinyin: 'Gēge bǐ wǒ gāo yìdiǎnr.', vi: 'Anh trai cao hơn tôi một chút.', note: 'A 比 B + 高 + 一点儿.' }
          ],
          mistake: '❌ Sai: "他比我很高" (thêm 很 vào câu 比)  →  ✅ Đúng: "他比我高" hoặc "他比我高得多".',
          check: { q: 'Câu so sánh nào ĐÚNG cho "Táo đắt hơn chuối"?', opts: ['苹果比香蕉很贵。', '苹果比香蕉贵。', '苹果贵比香蕉。', '比苹果香蕉贵。'], ans: 1, explain: 'Cấu trúc chuẩn là A + 比 + B + Tính từ (không thêm 很) → 苹果比香蕉贵。' }
        }
      ]
    },
    {
      num: 7, group: 'parts', title: 'Bổ ngữ trình độ 得 (de) & Bổ ngữ kết quả', level: 'HSK 2',
      points: [
        {
          title: 'Khen/nhận xét mức độ làm việc (V + 得 + 很 + Tính từ) & Kết quả (看完, 听懂)',
          formula: 'S + (V + O) + V + 得 + 很 + Adj  |  V + 完 / 懂 / 到',
          rule: 'Muốn khen ai đó làm việc gì rất giỏi ("nói rất lưu loát", "viết rất đẹp"), đặt trợ từ 得 (de) ngay sau động từ rồi mới tới tính từ. Muốn nhấn mạnh KẾT QUẢ của hành động, ghép thêm chữ chỉ kết quả ngay sau động từ: 听懂 (nghe hiểu), 看完 (xem xong), 找到 (tìm thấy).',
          examples: [
            { text: '你说中文说得很好！', pinyin: 'Nǐ shuō Zhōngwén shuō de hěn hǎo!', vi: 'Bạn nói tiếng Trung rất giỏi!', note: 'Có tân ngữ 中文 nên lặp lại động từ 说 trước 得.' },
            { text: '老师的话我听懂了。', pinyin: 'Lǎoshī de huà wǒ tīngdǒng le.', vi: 'Lời cô giáo nói tôi nghe hiểu rồi.', note: '听 (nghe) + 懂 (hiểu) = nghe hiểu.' },
            { text: '我写完作业了。', pinyin: 'Wǒ xiěwán zuòyè le.', vi: 'Tôi làm xong bài tập rồi.', note: '写 (viết) + 完 (xong) = viết xong.' }
          ],
          mistake: '❌ Sai: "他跑很快" (thiếu 得)  →  ✅ Đúng: "他跑得很快" (Anh ấy chạy rất nhanh).',
          check: { q: 'Điền trợ từ đúng: "她唱___非常好听。" (Cô ấy hát rất hay)', opts: ['的', '得', '地', '了'], ans: 1, explain: 'Sau động từ 唱 (hát) để bổ nghĩa trình độ/mức độ luôn dùng chữ 得.' }
        }
      ]
    },
    {
      num: 8, group: 'structures', title: 'Cặp liên từ quan trọng & Câu chữ 把 (bǎ)', level: 'HSK 2–3',
      points: [
        {
          title: '3 cặp liên từ giao tiếp đắt giá (因为...所以..., 虽然...但是..., 如果...就...)',
          formula: '因为... 所以...  |  虽然... 但是...  |  如果... 就...',
          rule: 'Tiếng Trung rất thích dùng theo cặp liên từ để câu văn mạch lạc (khác tiếng Anh không dùng cả Because lẫn So cùng lúc, tiếng Trung lại DÙNG CẢ HAI 因为...所以... rất tự nhiên!).',
          examples: [
            { text: '因为下雨，所以我们不去公园。', pinyin: 'Yīnwèi xiàyǔ, suǒyǐ wǒmen bú qù gōngyuán.', vi: 'Vì trời mưa nên chúng tôi không đi công viên.', note: 'Dùng trọn cặp 因为...所以...' },
            { text: '虽然汉字有点儿难，但是很有意思。', pinyin: 'Suīrán Hànzì yǒudiǎnr nán, dànshì hěn yǒuyìsi.', vi: 'Tuy chữ Hán hơi khó nhưng rất thú vị.', note: 'Dùng cặp 虽然...但是...' },
            { text: '如果明天有时间，我就去看你。', pinyin: 'Rúguǒ míngtiān yǒu shíjiān, wǒ jiù qù kàn nǐ.', vi: 'Nếu ngày mai có thời gian, tôi sẽ đến thăm bạn.', note: 'Lưu ý: 就 đặt SAU chủ ngữ 我 (我就...).' }
          ],
          mistake: '❌ Sai: "如果明天有时间，就我去看你"  →  ✅ Đúng: "我就去看你" (就 luôn đứng sau chủ ngữ).',
          check: { q: 'Điền cặp từ đúng: "___天气很冷，___他穿了很多衣服。"', opts: ['虽然...但是', '因为...所以', '如果...就', '不但...而且'], ans: 1, explain: 'Quan hệ nguyên nhân – kết quả ("Vì trời lạnh nên anh ấy mặc nhiều áo") dùng 因为...所以.' }
        }
      ]
    },
    {
      num: 9, group: 'structures', title: 'Câu mệnh lệnh, nhờ vả & rủ rê (请 / 别 / 吧)', level: 'HSK 1–2',
      points: [
        {
          title: 'Mời lịch sự (请 + V), Khuyên đừng làm (别 / 不要 + V) & Rủ rê (...吧)',
          formula: '请 + V  |  别 / 不要 + V  |  S + V + 吧',
          rule: 'Đặt 请 (qǐng) trước động từ để nói lịch sự ("mời / xin vui lòng"). Dùng 别 (bié) hoặc 不要 (búyào) trước động từ để khuyên ngăn ("đừng làm..."). Đặt trợ từ 吧 (ba) ở cuối câu để rủ rê hoặc gợi ý nhẹ nhàng ("nhé / thôi").',
          examples: [
            { text: '请进，请坐！', pinyin: 'Qǐng jìn, qǐng zuò!', vi: 'Mời vào, mời ngồi!', note: '请 đặt trước động từ tạo câu mời cực lịch sự.' },
            { text: '别跑，小心摔倒！', pinyin: 'Bié pǎo, xiǎoxīn shuāidǎo!', vi: 'Đừng chạy, cẩn thận té ngã nhé!', note: '别 + V dùng rất nhiều khi nhắc nhở bé.' },
            { text: '我们一起去吃冰淇淋吧！', pinyin: 'Wǒmen yìqǐ qù chī bīngqílín ba!', vi: 'Chúng mình cùng đi ăn kem nhé!', note: 'Cuối câu thêm 吧 để rủ rê thân thiện.' }
          ],
          mistake: '❌ Sai: "不跑！" khi muốn nói "Đừng chạy!"  →  ✅ Đúng: "别跑！" hoặc "不要跑！".',
          check: { q: 'Muốn nhắc bé "Đừng nói chuyện nhé!", câu nào đúng nhất?', opts: ['不说话！', '别说话！', '没说话！', '是说话！'], ans: 1, explain: 'Câu mệnh lệnh khuyên ngăn ("đừng...") trong tiếng Trung dùng 别 / 不要 + V → 别说话！' }
        }
      ]
    },
    {
      num: 10, group: 'structures', title: 'Câu bị động chữ 被 (bèi) & Câu chữ 把 (bǎ)', level: 'HSK 2–3',
      points: [
        {
          title: 'Câu bị động (被 bèi) & Câu xử lý đồ vật (把 bǎ)',
          formula: 'S + 被 (+ O) + V + kết quả  |  S + 把 + O + V + kết quả',
          rule: 'Câu chữ 被 (bèi) dùng khi muốn nói ai/cái gì "bị / được" làm sao đó (thường mang kết quả rõ ràng). Câu chữ 把 (bǎ) đưa đồ vật lên TRƯỚC động từ để nhấn mạnh hành động làm thay đổi vị trí/trạng thái của vật đó (ví dụ: "để sách lên bàn", "uống hết sữa").',
          examples: [
            { text: '我的苹果被弟弟吃了。', pinyin: 'Wǒ de píngguǒ bèi dìdi chī le.', vi: 'Quả táo của tôi bị em trai ăn mất rồi.', note: 'Táo (đối tượng) + 被 + em trai + 吃了 (động từ + kết quả).' },
            { text: '请把门打开。', pinyin: 'Qǐng bǎ mén dǎkāi.', vi: 'Làm ơn mở cửa ra nhé.', note: '把 + 门 (cửa) + 打开 (mở ra — có kết quả 开).' },
            { text: '我把作业写完了。', pinyin: 'Wǒ bǎ zuòyè xiěwán le.', vi: 'Tôi đã làm xong bài tập rồi.', note: '把 + 作业 (bài tập) + 写完了 (viết xong).' }
          ],
          mistake: '❌ Sai: Dùng 把 với động từ đứng trơ một mình ("我把苹果吃")  →  ✅ Đúng: Phải có kết quả phía sau ("我把苹果吃了 / 吃完了").',
          check: { q: 'Câu bị động "Chiếc cốc bị tôi làm vỡ rồi" nói thế nào?', opts: ['杯子把我打破了。', '杯子被我打破了。', '我被杯子打破了。', '杯子是打破了。'], ans: 1, explain: 'Chiếc cốc (杯子) chịu tác động nên dùng câu bị động chữ 被 → 杯子被我打破了。' }
        }
      ]
    },
    {
      num: 11, group: 'parts', title: 'Phân biệt bộ ba 的 / 地 / 得 & Trợ từ 着 (zhe)', level: 'HSK 2',
      points: [
        {
          title: 'Mẹo nhớ không bao giờ nhầm bộ ba 的 · 地 · 得 (đều đọc "de")',
          formula: 'Adj + 的 + N  |  Adv + 地 + V  |  V + 得 + Adj',
          rule: 'Cả 3 chữ đều đọc nhẹ là "de", nhưng vị trí hoàn toàn khác nhau: trước DANH TỪ dùng 的 (bạch-đích); trước ĐỘNG TỪ (chỉ cách làm) dùng 地 (thổ-địa); SAU ĐỘNG TỪ (khen mức độ) dùng 得 (song-nhân-đắc).',
          examples: [
            { text: '她穿着一件漂亮的裙子。', pinyin: 'Tā chuānzhe yí jiàn piàoliang de qúnzi.', vi: 'Cô bé đang mặc một chiếc váy đẹp.', note: '漂亮 (đẹp) + 的 + 裙子 (váy — danh từ). Chữ 着 sau 穿 chỉ trạng thái đang mặc trên người.' },
            { text: '孩子们高兴地笑了。', pinyin: 'Háizimen gāoxìng de xiào le.', vi: 'Các bé cười một cách vui vẻ.', note: '高兴 (vui vẻ) + 地 + 笑 (cười — động từ).' },
            { text: '哥哥跑得非常快。', pinyin: 'Gēge pǎo de fēicháng kuài.', vi: 'Anh trai chạy cực kỳ nhanh.', note: '跑 (chạy — động từ) + 得 + 非常快 (rất nhanh).' }
          ],
          mistake: '❌ Sai: Nhầm lẫn cả 3 chữ đều viết thành 的  →  ✅ Nhớ vần: "Trước Danh dùng 的, trước Động dùng 地, sau Động dùng 得".',
          check: { q: 'Điền chữ "de" đúng: "他认真___写汉字。" (Cậu ấy chăm chú viết chữ Hán)', opts: ['的', '地', '得', '了'], ans: 1, explain: 'Đứng trước động từ 写 (viết) để tả cách thức làm hành động nên dùng 地.' }
        }
      ]
    },
    {
      num: 12, group: 'structures', title: 'Định ngữ dài với 的 & Câu liên động', level: 'HSK 2',
      points: [
        {
          title: 'Cách nói "Mệnh đề quan hệ" kiểu Trung (Cụm bổ nghĩa + 的 + Danh từ) & Câu liên động',
          formula: '[Mô tả] + 的 + N  |  S + V1 + V2',
          rule: 'Tiếng Trung KHÔNG dùng who/which đứng sau như tiếng Anh, mà gom TOÀN BỘ phần giải thích đặt TRƯỚC chữ 的 rồi mới tới danh từ chính (dịch ngược từ sau chữ 的 ra trước!). Còn Câu liên động chỉ cần xếp 2 động từ theo đúng thứ tự thời gian diễn ra (không cần "to" hay "and").',
          examples: [
            { text: '这是我昨天买的书。', pinyin: 'Zhè shì wǒ zuótiān mǎi de shū.', vi: 'Đây là cuốn sách mà hôm qua tôi đã mua.', note: 'Đặt "我昨天买" (hôm qua tôi mua) TRƯỚC 的 + 书 (sách).' },
            { text: '穿红衣服的女孩是我妹妹。', pinyin: 'Chuān hóng yīfu de nǚhái shì wǒ mèimei.', vi: 'Cô bé mặc áo đỏ là em gái tôi.', note: 'Cụm "穿红衣服" (mặc áo đỏ) đứng trước 的 + 女孩 (cô bé).' },
            { text: '我去超市买水果。', pinyin: 'Wǒ qù chāoshì mǎi shuǐguǒ.', vi: 'Tôi đi siêu thị mua hoa quả.', note: 'Câu liên động: 去超市 (V1) nối thẳng 买水果 (V2), không cần từ nối.' }
          ],
          mistake: '❌ Sai: "这是书我昨天买" (dịch xuôi theo tiếng Việt)  →  ✅ Đúng: "这是我昨天买的书".',
          check: { q: 'Dịch đúng câu "Món ăn mẹ nấu rất ngon":', opts: ['菜妈妈做的很好吃。', '妈妈做的菜很好吃。', '妈妈做菜的很好吃。', '很好吃的妈妈做菜。'], ans: 1, explain: 'Phần bổ nghĩa "妈妈做" (mẹ nấu) đặt TRƯỚC 的 + 菜 (món ăn) → 妈妈做的菜很好吃。' }
        }
      ]
    }
  ]
};