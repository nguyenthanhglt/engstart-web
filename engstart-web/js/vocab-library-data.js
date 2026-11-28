/* EngStart v33: independently authored supplementary learning material.
   Levels are teaching estimates; not official Oxford, IELTS, TOEIC or HSK lists. */
(() => {
  const topics = [
    ['people','👥','Con người & Quan hệ'],['emotion','😊','Cảm xúc & Tính cách'],['health','🩺','Cơ thể & Sức khỏe'],['food','🍲','Ẩm thực'],['home','🏡','Nhà cửa & Đời sống'],['money','💰','Kinh tế & Tiền bạc'],['education','🎓','Giáo dục'],['work','💼','Công việc'],['travel','🚆','Du lịch & Giao thông'],['city','🏙️','Đô thị & Nơi chốn'],['nature','🌿','Thiên nhiên & Môi trường'],['tech','💻','Khoa học & Công nghệ'],['media','📱','Truyền thông'],['culture','🎨','Văn hóa & Nghệ thuật'],['sport','⚽','Thể thao & Giải trí'],['society','⚖️','Xã hội & Pháp luật'],['time','📅','Thời gian & Số lượng'],['grammar','🧩','Từ ngữ pháp'],['action','🏃','Hành động chung'],['quality','✨','Tính chất & Mô tả'],['general','💡','Khái niệm chung'],['other','📦','Chủ đề khác']
  ];
  const rows = []; const add=(lang,topic,level,kind,text)=>text.trim().split('\n').forEach(line=>{const [word,ipa,pos,vi,ex,exVi,definition]=line.split('|');if(word&&vi)rows.push({lang,topic,level,kind,en:word,ipa,pos,vi,exEn:ex||'',exVi:exVi||'',definition:definition||''});});
  add('en','people','A1','word',`partner|/ˈpɑːrtnər/|danh từ|bạn cùng cặp; đối tác|Work with a partner.|Hãy làm việc với một bạn cùng cặp.|A person you work or do an activity with.
 cousin|/ˈkʌzən/|danh từ|anh chị em họ|My cousin lives nearby.|Anh họ tôi sống gần đây.
 guest|/ɡest/|danh từ|khách mời|We have a guest today.|Hôm nay chúng tôi có khách.`.replace(/^ +/gm,''));
  add('en','people','B2','word',`acquaintance|/əˈkweɪntəns/|danh từ|người quen|She is an acquaintance from work.|Cô ấy là một người quen ở chỗ làm.
 rapport|/ræˈpɔːr/|danh từ|mối quan hệ hòa hợp|The teacher built a good rapport with the class.|Giáo viên xây dựng mối quan hệ tốt với lớp.
 mutual|/ˈmjuːtʃuəl/|tính từ|lẫn nhau; chung|Trust requires mutual respect.|Niềm tin cần sự tôn trọng lẫn nhau.
 commitment|/kəˈmɪtmənt/|danh từ|sự cam kết|The project requires commitment.|Dự án cần sự cam kết.
 empathy|/ˈempəθi/|danh từ|sự đồng cảm|Try to show empathy when others struggle.|Hãy cố gắng thể hiện sự đồng cảm khi người khác gặp khó khăn.`);
  add('en','emotion','B2','word',`resilient|/rɪˈzɪliənt/|tính từ|có khả năng phục hồi|Children can be remarkably resilient.|Trẻ em có thể có khả năng phục hồi đáng kinh ngạc.
 overwhelmed|/ˌoʊvərˈwelmd/|tính từ|quá tải; choáng ngợp|I felt overwhelmed by the workload.|Tôi cảm thấy quá tải vì khối lượng công việc.
 reluctant|/rɪˈlʌktənt/|tính từ|miễn cưỡng|He was reluctant to ask for help.|Anh ấy ngại nhờ giúp đỡ.
 frustrated|/ˈfrʌstreɪtɪd/|tính từ|bực bội; nản lòng|She became frustrated with the delay.|Cô ấy bực bội vì sự chậm trễ.
 compassionate|/kəmˈpæʃənət/|tính từ|giàu lòng trắc ẩn|We need compassionate leaders.|Chúng ta cần những người lãnh đạo giàu lòng trắc ẩn.`);
  add('en','health','B2','word',`symptom|/ˈsɪmptəm/|danh từ|triệu chứng|A cough can be a symptom of a cold.|Ho có thể là triệu chứng của cảm lạnh.
 diagnosis|/ˌdaɪəɡˈnoʊsɪs/|danh từ|chẩn đoán|The doctor explained the diagnosis.|Bác sĩ giải thích chẩn đoán.
 recovery|/rɪˈkʌvəri/|danh từ|sự hồi phục|Rest is important for recovery.|Nghỉ ngơi rất quan trọng cho quá trình hồi phục.
 nutrition|/nuːˈtrɪʃən/|danh từ|dinh dưỡng|Good nutrition supports growth.|Dinh dưỡng tốt hỗ trợ sự phát triển.
 preventive|/prɪˈventɪv/|tính từ|mang tính phòng ngừa|Preventive care can reduce health risks.|Chăm sóc phòng ngừa có thể giảm rủi ro sức khỏe.`);
  add('en','food','B2','word',`ingredient|/ɪnˈɡriːdiənt/|danh từ|nguyên liệu|Check every ingredient on the label.|Hãy kiểm tra từng nguyên liệu trên nhãn.
 cuisine|/kwɪˈziːn/|danh từ|ẩm thực|Vietnamese cuisine is diverse.|Ẩm thực Việt Nam rất đa dạng.
 portion|/ˈpɔːrʃən/|danh từ|khẩu phần|We shared a large portion of rice.|Chúng tôi chia nhau một khẩu phần cơm lớn.
 savoury|/ˈseɪvəri/|tính từ|có vị mặn, không ngọt|I prefer savoury snacks.|Tôi thích đồ ăn nhẹ không ngọt.
 perishable|/ˈperɪʃəbəl/|tính từ|dễ hỏng|Keep perishable food refrigerated.|Hãy bảo quản thực phẩm dễ hỏng trong tủ lạnh.`);
  add('en','home','B2','word',`household|/ˈhaʊshoʊld/|danh từ|hộ gia đình|Each household received a survey.|Mỗi hộ gia đình nhận được một khảo sát.
 appliance|/əˈplaɪəns/|danh từ|thiết bị gia dụng|This appliance uses less electricity.|Thiết bị này dùng ít điện hơn.
 renovation|/ˌrenəˈveɪʃən/|danh từ|việc cải tạo|The kitchen needs renovation.|Nhà bếp cần được cải tạo.
 maintenance|/ˈmeɪntənəns/|danh từ|việc bảo trì|Regular maintenance saves money.|Bảo trì định kỳ giúp tiết kiệm tiền.
 accommodation|/əˌkɑːməˈdeɪʃən/|danh từ|chỗ ở|The course includes accommodation.|Khóa học bao gồm chỗ ở.`);
  add('en','money','B2','word',`revenue|/ˈrevənuː/|danh từ|doanh thu|Revenue increased this year.|Doanh thu tăng trong năm nay.
 expenditure|/ɪkˈspendɪtʃər/|danh từ|chi tiêu|We reviewed our monthly expenditure.|Chúng tôi xem xét chi tiêu hằng tháng.
 inflation|/ɪnˈfleɪʃən/|danh từ|lạm phát|Inflation affects food prices.|Lạm phát ảnh hưởng giá thực phẩm.
 affordable|/əˈfɔːrdəbəl/|tính từ|có giá phải chăng|We need affordable housing.|Chúng ta cần nhà ở có giá phải chăng.
 investment|/ɪnˈvestmənt/|danh từ|sự đầu tư; khoản đầu tư|Education is an investment in the future.|Giáo dục là khoản đầu tư cho tương lai.`);
  add('en','education','B2','word',`curriculum|/kəˈrɪkjələm/|danh từ|chương trình học|The school revised its curriculum.|Trường đã sửa đổi chương trình học.
 assessment|/əˈsesmənt/|danh từ|sự đánh giá|The assessment includes a speaking task.|Bài đánh giá gồm một nhiệm vụ nói.
 scholarship|/ˈskɑːlərʃɪp/|danh từ|học bổng|She applied for a scholarship.|Cô ấy nộp đơn xin học bổng.
 literacy|/ˈlɪtərəsi/|danh từ|khả năng đọc viết|Literacy is an essential skill.|Khả năng đọc viết là một kỹ năng thiết yếu.
 proficiency|/prəˈfɪʃənsi/|danh từ|sự thành thạo|The test measures language proficiency.|Bài thi đo mức độ thành thạo ngôn ngữ.`);
  add('en','work','B2','word',`deadline|/ˈdedlaɪn/|danh từ|hạn chót|We must meet the deadline.|Chúng ta phải đáp ứng hạn chót.
 applicant|/ˈæplɪkənt/|danh từ|ứng viên|Each applicant had an interview.|Mỗi ứng viên đều có một cuộc phỏng vấn.
 colleague|/ˈkɑːliːɡ/|danh từ|đồng nghiệp|My colleague helped me finish the report.|Đồng nghiệp giúp tôi hoàn thành báo cáo.
 negotiate|/nɪˈɡoʊʃieɪt/|động từ|đàm phán|They negotiated a new contract.|Họ đàm phán một hợp đồng mới.
 productivity|/ˌproʊdʌkˈtɪvəti/|danh từ|năng suất|Better tools can improve productivity.|Công cụ tốt hơn có thể cải thiện năng suất.
 invoice|/ˈɪnvɔɪs/|danh từ|hóa đơn thanh toán|Please send the invoice today.|Vui lòng gửi hóa đơn hôm nay.`);
  add('en','travel','B2','word',`itinerary|/aɪˈtɪnəreri/|danh từ|lịch trình|Our itinerary includes three cities.|Lịch trình của chúng tôi gồm ba thành phố.
 destination|/ˌdestɪˈneɪʃən/|danh từ|điểm đến|We arrived at our destination safely.|Chúng tôi đến điểm đến an toàn.
 cancellation|/ˌkænsəˈleɪʃən/|danh từ|việc hủy|The airline announced a cancellation.|Hãng hàng không thông báo một chuyến bị hủy.
 commute|/kəˈmjuːt/|động từ|đi làm thường xuyên|I commute by train.|Tôi đi làm bằng tàu.
 transfer|/ˈtrænsfɜːr/|danh từ|việc chuyển tuyến|The ticket includes a transfer.|Vé bao gồm một lần chuyển tuyến.`);
  add('en','city','B2','word',`infrastructure|/ˈɪnfrəstrʌktʃər/|danh từ|cơ sở hạ tầng|The city improved its infrastructure.|Thành phố cải thiện cơ sở hạ tầng.
 pedestrian|/pəˈdestriən/|danh từ|người đi bộ|The street is safe for pedestrians.|Con đường an toàn cho người đi bộ.
 residential|/ˌrezɪˈdenʃəl/|tính từ|thuộc khu dân cư|This is a residential area.|Đây là khu dân cư.
 congestion|/kənˈdʒestʃən/|danh từ|sự ùn tắc|Traffic congestion is a daily problem.|Ùn tắc giao thông là vấn đề hằng ngày.`);
  add('en','nature','B2','word',`biodiversity|/ˌbaɪoʊdaɪˈvɜːrsəti/|danh từ|đa dạng sinh học|Forests support biodiversity.|Rừng duy trì đa dạng sinh học.
 habitat|/ˈhæbɪtæt/|danh từ|môi trường sống|The wetland is a bird habitat.|Vùng đất ngập nước là môi trường sống của chim.
 emission|/ɪˈmɪʃən/|danh từ|sự phát thải|The policy aims to reduce emissions.|Chính sách nhằm giảm phát thải.
 sustainable|/səˈsteɪnəbəl/|tính từ|bền vững|We need sustainable solutions.|Chúng ta cần những giải pháp bền vững.
 conservation|/ˌkɑːnsərˈveɪʃən/|danh từ|sự bảo tồn|Conservation protects rare species.|Bảo tồn bảo vệ các loài quý hiếm.`);
  add('en','tech','B2','word',`innovation|/ˌɪnəˈveɪʃən/|danh từ|sự đổi mới|Innovation can solve practical problems.|Đổi mới có thể giải quyết các vấn đề thực tiễn.
 algorithm|/ˈælɡərɪðəm/|danh từ|thuật toán|The algorithm sorts the results.|Thuật toán sắp xếp kết quả.
 privacy|/ˈpraɪvəsi/|danh từ|quyền riêng tư|The app respects user privacy.|Ứng dụng tôn trọng quyền riêng tư của người dùng.
 automation|/ˌɔːtəˈmeɪʃən/|danh từ|sự tự động hóa|Automation reduces repetitive work.|Tự động hóa giảm công việc lặp lại.
 device|/dɪˈvaɪs/|danh từ|thiết bị|Connect the device to the network.|Kết nối thiết bị với mạng.`);
  add('en','media','B2','word',`headline|/ˈhedlaɪn/|danh từ|tiêu đề tin tức|The headline caught my attention.|Tiêu đề thu hút sự chú ý của tôi.
 broadcast|/ˈbrɔːdkæst/|động từ|phát sóng|The station broadcasts news daily.|Đài phát sóng tin tức hằng ngày.
 coverage|/ˈkʌvərɪdʒ/|danh từ|sự đưa tin|The event received extensive coverage.|Sự kiện được đưa tin rộng rãi.
 misinformation|/ˌmɪsɪnfərˈmeɪʃən/|danh từ|thông tin sai lệch|Check the source to avoid misinformation.|Kiểm tra nguồn để tránh thông tin sai lệch.`);
  add('en','culture','B2','word',`heritage|/ˈherɪtɪdʒ/|danh từ|di sản|The town preserves its cultural heritage.|Thị trấn bảo tồn di sản văn hóa.
 exhibition|/ˌeksɪˈbɪʃən/|danh từ|triển lãm|We visited an art exhibition.|Chúng tôi tham quan một triển lãm nghệ thuật.
 contemporary|/kənˈtempəreri/|tính từ|đương đại|She enjoys contemporary art.|Cô ấy thích nghệ thuật đương đại.
 masterpiece|/ˈmæstərpiːs/|danh từ|kiệt tác|The painting is a masterpiece.|Bức tranh là một kiệt tác.`);
  add('en','sport','B2','word',`tournament|/ˈtʊrnəmənt/|danh từ|giải đấu|Our team entered the tournament.|Đội chúng tôi tham gia giải đấu.
 opponent|/əˈpoʊnənt/|danh từ|đối thủ|Respect your opponent.|Hãy tôn trọng đối thủ.
 endurance|/ɪnˈdʊrəns/|danh từ|sức bền|Running develops endurance.|Chạy bộ phát triển sức bền.
 leisure|/ˈliːʒər/|danh từ|thời gian rảnh|Reading is my favourite leisure activity.|Đọc sách là hoạt động giải trí yêu thích của tôi.`);
  add('en','society','B2','word',`equality|/iˈkwɑːləti/|danh từ|sự bình đẳng|The law promotes equality.|Luật thúc đẩy sự bình đẳng.
 regulation|/ˌreɡjəˈleɪʃən/|danh từ|quy định|Businesses must follow safety regulations.|Doanh nghiệp phải tuân thủ quy định an toàn.
 citizen|/ˈsɪtɪzən/|danh từ|công dân|Every citizen has responsibilities.|Mỗi công dân đều có trách nhiệm.
 welfare|/ˈwelfer/|danh từ|phúc lợi|The programme improves child welfare.|Chương trình cải thiện phúc lợi trẻ em.
 justice|/ˈdʒʌstɪs/|danh từ|công lý|People seek justice through the courts.|Người dân tìm kiếm công lý thông qua tòa án.`);
  add('en','time','B2','word',`duration|/dʊˈreɪʃən/|danh từ|khoảng thời gian|The duration of the course is six weeks.|Khóa học kéo dài sáu tuần.
 frequency|/ˈfriːkwənsi/|danh từ|tần suất|We measured the frequency of errors.|Chúng tôi đo tần suất lỗi.
 annual|/ˈænjuəl/|tính từ|hằng năm|The annual meeting is in June.|Cuộc họp thường niên diễn ra vào tháng sáu.
 proportion|/prəˈpɔːrʃən/|danh từ|tỷ lệ|A large proportion of students passed.|Một tỷ lệ lớn học sinh đã đỗ.`);
  add('en','grammar','B2','word',`whereas|/werˈæz/|liên từ|trong khi (đối lập)|I prefer tea, whereas she prefers coffee.|Tôi thích trà, trong khi cô ấy thích cà phê.
 nevertheless|/ˌnevərðəˈles/|trạng từ|tuy vậy|It was raining; nevertheless, we went out.|Trời mưa; tuy vậy, chúng tôi vẫn ra ngoài.
 despite|/dɪˈspaɪt/|giới từ|mặc dù; bất chấp|We continued despite the rain.|Chúng tôi tiếp tục bất chấp trời mưa.
 consequently|/ˈkɑːnsəkwentli/|trạng từ|do đó|The road was closed; consequently, we were late.|Đường bị đóng; do đó chúng tôi đến muộn.`);
  add('en','action','B2','word',`accomplish|/əˈkɑːmplɪʃ/|động từ|hoàn thành|We accomplished our goal.|Chúng tôi đã hoàn thành mục tiêu.
 adapt|/əˈdæpt/|động từ|thích nghi|Plants adapt to their environment.|Thực vật thích nghi với môi trường.
 evaluate|/ɪˈvæljueɪt/|động từ|đánh giá|Evaluate the results carefully.|Hãy đánh giá kết quả cẩn thận.
 implement|/ˈɪmplɪment/|động từ|triển khai|The team implemented the plan.|Nhóm đã triển khai kế hoạch.`);
  add('en','quality','B2','word',`accurate|/ˈækjərət/|tính từ|chính xác|The information must be accurate.|Thông tin phải chính xác.
 reliable|/rɪˈlaɪəbəl/|tính từ|đáng tin cậy|This is a reliable source.|Đây là một nguồn đáng tin cậy.
 efficient|/ɪˈfɪʃənt/|tính từ|hiệu quả, ít lãng phí|The new process is more efficient.|Quy trình mới hiệu quả hơn.
 flexible|/ˈfleksəbəl/|tính từ|linh hoạt|We offer flexible working hours.|Chúng tôi cung cấp giờ làm linh hoạt.`);
  add('en','general','C1','academic',`coherent|/koʊˈhɪrənt/|tính từ|mạch lạc|Present a coherent argument.|Hãy trình bày một lập luận mạch lạc.
 empirical|/ɪmˈpɪrɪkəl/|tính từ|dựa trên thực nghiệm|The theory requires empirical evidence.|Lý thuyết cần bằng chứng thực nghiệm.
 comprehensive|/ˌkɑːmprɪˈhensɪv/|tính từ|toàn diện|We need a comprehensive review.|Chúng ta cần một đánh giá toàn diện.
 mitigate|/ˈmɪtɪɡeɪt/|động từ|giảm nhẹ|Trees help mitigate urban heat.|Cây xanh giúp giảm nhiệt đô thị.
 discrepancy|/dɪˈskrepənsi/|danh từ|sự chênh lệch|We found a discrepancy in the figures.|Chúng tôi phát hiện sự chênh lệch trong các số liệu.
 ambiguous|/æmˈbɪɡjuəs/|tính từ|mơ hồ|The instructions were ambiguous.|Các hướng dẫn không rõ ràng.
 plausible|/ˈplɔːzəbəl/|tính từ|có vẻ hợp lý|That is a plausible explanation.|Đó là một lời giải thích có vẻ hợp lý.
 intrinsic|/ɪnˈtrɪnzɪk/|tính từ|nội tại|Learning has intrinsic value.|Việc học có giá trị nội tại.
 preliminary|/prɪˈlɪməneri/|tính từ|sơ bộ|The preliminary results are promising.|Kết quả sơ bộ rất khả quan.
 paradigm|/ˈpærədaɪm/|danh từ|mô hình tư duy|The discovery changed the scientific paradigm.|Phát hiện đã thay đổi mô hình tư duy khoa học.
 rigorous|/ˈrɪɡərəs/|tính từ|nghiêm ngặt|The study used rigorous methods.|Nghiên cứu dùng các phương pháp nghiêm ngặt.
 arbitrary|/ˈɑːrbətreri/|tính từ|tùy tiện|The decision should not be arbitrary.|Quyết định không nên tùy tiện.
 consensus|/kənˈsensəs/|danh từ|sự đồng thuận|The group reached a consensus.|Nhóm đã đạt được sự đồng thuận.
 substantial|/səbˈstænʃəl/|tính từ|đáng kể|There was a substantial improvement.|Có sự cải thiện đáng kể.
 implication|/ˌɪmplɪˈkeɪʃən/|danh từ|hệ quả; hàm ý|Discuss the implications of the findings.|Hãy thảo luận hệ quả của các phát hiện.`);
  add('en','action','A2','phrasal',`wake up||cụm động từ|thức dậy|I wake up at seven.|Tôi thức dậy lúc bảy giờ.
 look for||cụm động từ|tìm kiếm|I am looking for my keys.|Tôi đang tìm chìa khóa.
 turn on||cụm động từ|bật|Turn on the light, please.|Vui lòng bật đèn.
 turn off||cụm động từ|tắt|Turn off the TV.|Hãy tắt TV.
 put on||cụm động từ|mặc; đeo|Put on your coat.|Hãy mặc áo khoác.
 take off||cụm động từ|cởi; cất cánh|The plane takes off at noon.|Máy bay cất cánh lúc trưa.
 pick up||cụm động từ|đón; nhặt lên|I'll pick you up at the station.|Tôi sẽ đón bạn ở ga.
 find out||cụm động từ|tìm ra|Let's find out what happened.|Hãy tìm hiểu chuyện gì đã xảy ra.`);
  add('en','action','B1','phrasal',`give up||cụm động từ|từ bỏ|Don't give up on your goal.|Đừng từ bỏ mục tiêu.
 look after||cụm động từ|chăm sóc|She looks after her little brother.|Cô ấy chăm sóc em trai.
 run out of||cụm động từ|hết; cạn|We've run out of milk.|Chúng ta hết sữa rồi.
 carry on||cụm động từ|tiếp tục|Carry on with your work.|Hãy tiếp tục công việc.
 deal with||cụm động từ|xử lý|We need to deal with this problem.|Chúng ta cần xử lý vấn đề này.
 come across||cụm động từ|tình cờ gặp|I came across an old photo.|Tôi tình cờ thấy một bức ảnh cũ.
 set up||cụm động từ|thiết lập|They set up a new account.|Họ thiết lập tài khoản mới.
 work out||cụm động từ|tìm ra; tập luyện|We worked out a solution.|Chúng tôi tìm ra một giải pháp.`);
  add('en','work','B2','collocation',`meet a deadline||cụm từ|đáp ứng hạn chót|We worked together to meet a deadline.|Chúng tôi làm việc cùng nhau để đáp ứng hạn chót.
 make a decision||cụm từ|đưa ra quyết định|We need to make a decision.|Chúng ta cần đưa ra quyết định.
 reach an agreement||cụm từ|đạt được thỏa thuận|Both sides reached an agreement.|Hai bên đạt được thỏa thuận.
 take responsibility||cụm từ|chịu trách nhiệm|He took responsibility for the mistake.|Anh ấy chịu trách nhiệm về sai lầm.
 deliver a presentation||cụm từ|thuyết trình|She delivered a presentation to the team.|Cô ấy thuyết trình trước nhóm.`);
  add('en','education','B1','collocation',`make progress||cụm từ|tiến bộ|You are making progress.|Bạn đang tiến bộ.
 pay attention||cụm từ|chú ý|Pay attention to the instructions.|Hãy chú ý các hướng dẫn.
 take notes||cụm từ|ghi chép|Take notes during the lesson.|Hãy ghi chép trong giờ học.
 do research||cụm từ|nghiên cứu|We did research for the project.|Chúng tôi nghiên cứu cho dự án.
 gain experience||cụm từ|tích lũy kinh nghiệm|The internship helps you gain experience.|Kỳ thực tập giúp bạn tích lũy kinh nghiệm.`);
  add('en','general','C1','collocation',`draw a conclusion||cụm từ|rút ra kết luận|We cannot draw a conclusion yet.|Chúng ta chưa thể rút ra kết luận.
 pose a challenge||cụm từ|đặt ra thách thức|The lack of funding poses a challenge.|Thiếu kinh phí đặt ra thách thức.
 address an issue||cụm từ|giải quyết một vấn đề|The report addresses an important issue.|Báo cáo giải quyết một vấn đề quan trọng.
 provide evidence||cụm từ|cung cấp bằng chứng|The study provides evidence of change.|Nghiên cứu cung cấp bằng chứng về sự thay đổi.
 play a crucial role||cụm từ|đóng vai trò then chốt|Teachers play a crucial role in education.|Giáo viên đóng vai trò then chốt trong giáo dục.`);
  add('en','general','B2','idiom',`a piece of cake||thành ngữ|rất dễ|The test was a piece of cake.|Bài kiểm tra rất dễ.
 break the ice||thành ngữ|phá tan sự ngượng ngùng|A joke helped break the ice.|Một câu đùa giúp phá tan sự ngượng ngùng.
 under the weather||thành ngữ|cảm thấy không khỏe|I'm feeling under the weather.|Tôi cảm thấy không khỏe.
 on the same page||thành ngữ|có cùng cách hiểu|Let's make sure we're on the same page.|Hãy đảm bảo chúng ta hiểu giống nhau.
 once in a blue moon||thành ngữ|rất hiếm khi|We meet once in a blue moon.|Chúng tôi rất hiếm khi gặp nhau.
 in the long run||thành ngữ|về lâu dài|It will save money in the long run.|Về lâu dài việc đó sẽ tiết kiệm tiền.
 out of the blue||thành ngữ|bất ngờ|She called me out of the blue.|Cô ấy bất ngờ gọi cho tôi.
 call it a day||thành ngữ|dừng công việc trong ngày|Let's call it a day.|Hôm nay làm đến đây thôi.`);
  add('zh','work','HSK3','word',`会议|huìyì|danh từ|cuộc họp|下午有一个会议。|Buổi chiều có một cuộc họp.
 同事|tóngshì|danh từ|đồng nghiệp|她是我的同事。|Cô ấy là đồng nghiệp của tôi.
 经验|jīngyàn|danh từ|kinh nghiệm|他有很多工作经验。|Anh ấy có nhiều kinh nghiệm làm việc.
 合作|hézuò|động từ|hợp tác|我们一起合作吧。|Chúng ta cùng hợp tác nhé.
 计划|jìhuà|danh từ / động từ|kế hoạch; lên kế hoạch|你有什么计划？|Bạn có kế hoạch gì?`.replace(/^ +/gm,''));
  add('zh','travel','HSK3','word',`行李|xíngli|danh từ|hành lý|我的行李很重。|Hành lý của tôi rất nặng.
 护照|hùzhào|danh từ|hộ chiếu|请出示你的护照。|Vui lòng xuất trình hộ chiếu.
 乘客|chéngkè|danh từ|hành khách|乘客正在等车。|Hành khách đang đợi xe.
 预订|yùdìng|động từ|đặt trước|我想预订一个房间。|Tôi muốn đặt trước một phòng.
 方向|fāngxiàng|danh từ|phương hướng|请告诉我方向。|Xin hãy chỉ cho tôi hướng đi.`.replace(/^ +/gm,''));
  add('zh','education','HSK3','word',`复习|fùxí|động từ|ôn tập|我每天复习生词。|Tôi ôn từ mới hằng ngày.
 练习|liànxí|động từ / danh từ|luyện tập; bài tập|我们练习说汉语。|Chúng tôi luyện nói tiếng Trung.
 成绩|chéngjì|danh từ|thành tích; điểm số|她的成绩很好。|Điểm số của cô ấy rất tốt.
 解决|jiějué|động từ|giải quyết|我们一起解决这个问题。|Chúng ta cùng giải quyết vấn đề này.
 提高|tígāo|động từ|nâng cao|我想提高汉语水平。|Tôi muốn nâng cao trình độ tiếng Trung.`.replace(/^ +/gm,''));
  add('zh','health','HSK3','word',`检查|jiǎnchá|động từ / danh từ|kiểm tra|医生给我做了检查。|Bác sĩ đã kiểm tra cho tôi.
 休息|xiūxi|động từ|nghỉ ngơi|你应该好好休息。|Bạn nên nghỉ ngơi thật tốt.
 锻炼|duànliàn|động từ|rèn luyện; tập thể dục|他每天锻炼身体。|Anh ấy tập thể dục hằng ngày.
 健康|jiànkāng|danh từ / tính từ|sức khỏe; khỏe mạnh|健康很重要。|Sức khỏe rất quan trọng.`.replace(/^ +/gm,''));
  add('zh','tech','HSK4','word',`软件|ruǎnjiàn|danh từ|phần mềm|这个软件很方便。|Phần mềm này rất tiện lợi.
 网络|wǎngluò|danh từ|mạng|这里的网络很快。|Mạng ở đây rất nhanh.
 数据|shùjù|danh từ|dữ liệu|请保存这些数据。|Hãy lưu những dữ liệu này.
 技术|jìshù|danh từ|kỹ thuật; công nghệ|我们正在学习新技术。|Chúng tôi đang học công nghệ mới.
 安全|ānquán|tính từ / danh từ|an toàn; sự an toàn|网络安全很重要。|An toàn mạng rất quan trọng.`.replace(/^ +/gm,''));
  add('zh','nature','HSK4','word',`环境|huánjìng|danh từ|môi trường|我们应该保护环境。|Chúng ta nên bảo vệ môi trường.
 污染|wūrǎn|danh từ / động từ|ô nhiễm; gây ô nhiễm|空气污染影响健康。|Ô nhiễm không khí ảnh hưởng sức khỏe.
 资源|zīyuán|danh từ|tài nguyên|我们要节约资源。|Chúng ta cần tiết kiệm tài nguyên.
 保护|bǎohù|động từ|bảo vệ|大家都要保护动物。|Mọi người đều cần bảo vệ động vật.`.replace(/^ +/gm,''));
  add('zh','money','HSK4','word',`收入|shōurù|danh từ|thu nhập|他的收入增加了。|Thu nhập của anh ấy đã tăng.
 支出|zhīchū|danh từ|chi tiêu|我们记录每天的支出。|Chúng tôi ghi lại chi tiêu mỗi ngày.
 价格|jiàgé|danh từ|giá cả|这个价格很合理。|Mức giá này rất hợp lý.
 预算|yùsuàn|danh từ|ngân sách|旅行前要做预算。|Cần lập ngân sách trước chuyến đi.`.replace(/^ +/gm,''));
  add('zh','emotion','HSK4','word',`紧张|jǐnzhāng|tính từ|căng thẳng|考试前我有点紧张。|Trước kỳ thi tôi hơi căng thẳng.
 自信|zìxìn|tính từ / danh từ|tự tin; sự tự tin|她说话很自信。|Cô ấy nói chuyện rất tự tin.
 耐心|nàixīn|danh từ / tính từ|kiên nhẫn|学习语言需要耐心。|Học ngoại ngữ cần sự kiên nhẫn.
 失望|shīwàng|tính từ / động từ|thất vọng|这个结果让我很失望。|Kết quả này khiến tôi rất thất vọng.`.replace(/^ +/gm,''));
  add('zh','general','HSK4','phrase',`不但……而且……|búdàn…érqiě…|cấu trúc|không những… mà còn…|他不但会说英语，而且会说汉语。|Anh ấy không những biết nói tiếng Anh mà còn biết nói tiếng Trung.
 虽然……但是……|suīrán…dànshì…|cấu trúc|tuy… nhưng…|虽然很累，但是我很开心。|Tuy rất mệt nhưng tôi rất vui.
 一边……一边……|yìbiān…yìbiān…|cấu trúc|vừa… vừa…|她一边听音乐一边做饭。|Cô ấy vừa nghe nhạc vừa nấu ăn.
 越来越|yuèláiyuè|cụm từ|ngày càng|我的汉语越来越好。|Tiếng Trung của tôi ngày càng tốt.`.replace(/^ +/gm,''));
  window.EngStartVocabularyData={topics,rows:rows.map(w=>({...w,en:w.en.trim()}))};
})();
