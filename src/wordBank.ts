export interface WordPack {
  id: string;
  name: string;
  description: string;
  items: string[];
}

export const WORD_PACKS: WordPack[] = [
  {
    id: 'vietnamese_idioms',
    name: 'Tục ngữ & Ca dao Việt Nam (Khuyên dùng)',
    description: 'Các câu tục ngữ, ca dao quen thuộc, giàu ý nghĩa.',
    items: [
      'Học thầy không tày học bạn',
      'Có công mài sắt có ngày nên kim',
      'Uống nước nhớ nguồn ăn quả nhớ người trồng cây',
      'Đi một ngày đàng học một sàng khôn',
      'Lá lành đùm lá rách',
      'Gần mực thì đen gần đèn thì rạng',
      'Học ăn học nói học gói học mở',
      'Muốn biết phải hỏi muốn giỏi phải học',
      'Tiên học lễ hậu học văn',
      'Một cây làm chẳng nên non ba cây chụm lại nên hòn núi cao',
      'Lời nói chẳng mất tiền mua lựa lời mà nói cho vừa lòng nhau',
      'Ăn quả nhớ kẻ trồng cây có danh có vọng nhớ thầy khi xưa',
      'Non cao cũng có đường trèo đường dẫu hiểm nghèo cũng có lối đi',
      'Văn hay chữ tốt không bằng siêng năng luyện rèn',
      'Kiến tha lâu cũng có ngày đầy tổ'
    ]
  },
  {
    id: 'vietnamese_words',
    name: 'Từ vựng Tiếng Việt quen thuộc',
    description: 'Rèn luyện phản xạ gõ từ ghép nhanh và chính xác.',
    items: [
      'học sinh', 'thầy giáo', 'cô giáo', 'trường học', 'lớp học', 'bảng đen', 'phấn trắng',
      'sách vở', 'bút mực', 'thước kẻ', 'máy tính', 'bàn phím', 'chuột máy', 'màn hình',
      'tương lai', 'thành công', 'chăm chỉ', 'kiên trì', 'sáng tạo', 'tự tin', 'trung thực',
      'yêu thương', 'đoàn kết', 'giúp đỡ', 'bạn bè', 'gia đình', 'quê hương', 'đất nước',
      'khoa học', 'công nghệ', 'tri thức', 'khám phá', 'ước mơ', 'hoài bão', 'nỗ lực'
    ]
  },
  {
    id: 'vietnamese_science',
    name: 'Kiến thức Khoa học & Cuộc sống',
    description: 'Gõ đoạn văn ngắn về tự nhiên và vũ trụ.',
    items: [
      'Mặt Trời là ngôi sao ở trung tâm của Hệ Mặt Trời',
      'Nước chiếm khoảng bảy mươi phần trăm bề mặt Trái Đất',
      'Ánh sáng truyền đi với vận tốc xấp xỉ ba trăm nghìn kilomet trên giây',
      'Cây xanh quang hợp hấp thụ khí cacbonic và giải phóng oxy',
      'Trái Đất quay quanh trục của nó mất khoảng hai mươi tư giờ',
      'Bầu khí quyển bảo vệ sự sống trên Trái Đất khỏi các bức xạ có hại',
      'Đại dương là nơi sinh sống của hàng triệu loài sinh vật kỳ diệu',
      'Trí tuệ nhân tạo đang thay đổi cách con người làm việc và học tập'
    ]
  },
  {
    id: 'english_basic',
    name: 'English Vocabulary & Sentences (Tiếng Anh)',
    description: 'Rèn luyện kỹ năng gõ bàn phím tiếng Anh cơ bản.',
    items: [
      'The quick brown fox jumps over the lazy dog',
      'Practice makes perfect in typing and coding',
      'Knowledge is power when shared with others',
      'Never stop learning because life never stops teaching',
      'Believe you can and you are halfway there',
      'Success comes to those who work hard and never give up',
      'Computer science opens new doors to the future',
      'Technology connects people all around the world',
      'Stay curious and keep exploring every single day'
    ]
  }
];

export function getRandomText(packId: string = 'vietnamese_idioms'): string[] {
  const pack = WORD_PACKS.find(p => p.id === packId) || WORD_PACKS[0];
  // Trộn ngẫu nhiên danh sách
  return [...pack.items].sort(() => Math.random() - 0.5);
}
