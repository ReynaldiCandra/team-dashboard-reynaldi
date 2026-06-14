export interface WAScript { title:string;tag:string;text:(namaOrtu:string,namaAnak:string,staffName?:string)=>string; }
export interface WAScriptCategory { category:string;icon:string;color:string;scripts:WAScript[]; }
export const WA_SCRIPTS: WAScriptCategory[] = [
  { category:"Pesan Pertama",icon:"👋",color:"bg-green-500",scripts:[
    { title:"Perkenalan Awal",tag:"Pertama kali hubungi",text:(n,c,s="Staff Marketing")=>`Assalamualaikum Bapak/Ibu ${n} 🌟\n\nPerkenalkan, saya *${s}* dari Tim Marketing *Alexandria School*.\n\nSaya ingin menyampaikan informasi mengenai program unggulan kami yang mungkin sangat cocok untuk putra/putri Bapak/Ibu, *${c}*.\n\nApakah Bapak/Ibu berkenan jika saya berbagi informasi lebih lanjut? 🙏` },
    { title:"Dari Referral",tag:"Lead dari rekomendasi",text:(n,c,s="Staff Marketing")=>`Assalamualaikum Bapak/Ibu ${n} 👋\n\nSaya *${s}* dari Alexandria School. Kami mendapat informasi bahwa Bapak/Ibu sedang mencari sekolah terbaik untuk *${c}*.\n\nAlhamdulillah, kami memiliki program yang sangat sesuai! Boleh saya ceritakan sedikit? 😊` },
    { title:"Dari Media Sosial",tag:"Lead dari IG/FB/TikTok",text:(n,c,s="Staff Marketing")=>`Halo Bapak/Ibu ${n}! 😊\n\nSaya *${s}* dari *Alexandria School*. Saya melihat Bapak/Ibu tertarik dengan postingan kami.\n\nBoleh saya bantu jelaskan lebih detail mengenai program untuk *${c}*? ✨` },
    { title:"Dari Pameran",tag:"Setelah pameran/open house",text:(n,c,s="Staff Marketing")=>`Assalamualaikum Bapak/Ibu ${n} 🎉\n\nSenang bertemu di acara kemarin! Saya *${s}* dari *Alexandria School*.\n\nIngin menindaklanjuti ketertarikan mengenai pendaftaran *${c}*. Ada waktu ngobrol? 🙏` },
  ]},
  { category:"Follow Up HOT 🔥",icon:"🔥",color:"bg-red-500",scripts:[
    { title:"Dorong ke Closing",tag:"Lead sangat tertarik",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 😊\n\nAda *promo spesial* yang sayang untuk dilewatkan minggu ini untuk *${c}*!\n\n⚡ Kuota terbatas!\n\nApakah Bapak/Ibu sudah ada waktu untuk kita diskusikan? 🎯` },
    { title:"Pengingat Batas Waktu",tag:"Promo hampir habis",text:(n,c)=>`Bapak/Ibu ${n} 🌟\n\n⚠️ *Kuota pendaftaran ${c} tinggal 3 tempat!*\n\nApakah Bapak/Ibu sudah siap konfirmasi? Kami bisa proses *hari ini juga!* ✅` },
    { title:"Setelah Presentasi",tag:"Sudah presentasi/demo",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 😊\n\nTerima kasih sudah meluangkan waktu berdiskusi. Ada pertanyaan mengenai pendaftaran *${c}*?\n\nSaya siap membantu kapan saja 🙏` },
    { title:"Tawaran Khusus Personal",tag:"Penawaran eksklusif",text:(n,c)=>`Bapak/Ibu ${n} 🌸\n\nKhusus untuk *${c}*, ada penawaran istimewa:\n✅ Diskon biaya pendaftaran 20%\n✅ Seragam gratis 2 set\n✅ Cicilan 0% hingga 12 bulan\n\n*Berlaku hari ini saja!* 🎁` },
  ]},
  { category:"Follow Up WARM",icon:"🌡️",color:"bg-orange-500",scripts:[
    { title:"Masih Pertimbangkan",tag:"Lead belum memutuskan",text:(n,c)=>`Halo Bapak/Ibu ${n} 🌸\n\nAda *beasiswa & cicilan 0%* untuk *${c}* bulan ini!\n\nAda pertanyaan yang bisa saya bantu? 💬` },
    { title:"Ajak Kunjungan",tag:"Tour sekolah",text:(n,c)=>`Bapak/Ibu ${n} 😊\n\nBagaimana jika Bapak/Ibu dan *${c}* berkunjung ke *Alexandria School*?\n\n📍 Lihat fasilitas, suasana belajar & bertemu pengajar langsung.\n\nMau kita jadwalkan? 🏫` },
    { title:"Kirim Brosur Digital",tag:"Share materi informasi",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 👋\n\nSaya lampirkan brosur digital untuk *${c}*. Mohon ditinjau ya 😊\n\nAda pertanyaan? Saya siap! 🙏` },
    { title:"Lead Lama Tidak Respon",tag:"Tidak respon lama",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 🌟\n\nApakah Bapak/Ibu masih berminat dengan info pendaftaran *${c}*?\n\nKami masih siap membantu kapan pun 🙏` },
  ]},
  { category:"Follow Up COLD ❄️",icon:"❄️",color:"bg-blue-500",scripts:[
    { title:"Penawaran Baru",tag:"Bangkitkan minat lagi",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 😊\n\nAda *program baru yang sangat menarik* untuk ${c}!\n\nApakah Bapak/Ibu tertarik mendengar info terbarunya? 🌟` },
    { title:"Prestasi Sekolah",tag:"Tunjukkan pencapaian",text:(n)=>`Bapak/Ibu ${n} 🏆\n\nKami baru meraih:\n🥇 Juara 1 Olimpiade Matematika Nasional\n🏅 Akreditasi A\n⭐ Rating 4.9/5 dari 500+ ortu\n\nMungkin bisa jadi pertimbangan? 😊` },
    { title:"Promo Musiman",tag:"Promo tahun ajaran baru",text:(n,c)=>`Halo Bapak/Ibu ${n} 🎊\n\n*Promo Tahun Ajaran Baru* untuk *${c}*:\n🎁 Beasiswa s/d 50%\n📚 Buku gratis 1 tahun\n\nMinat? 🙏` },
  ]},
  { category:"Closing & Pembayaran",icon:"⭐",color:"bg-yellow-500",scripts:[
    { title:"Final Closing",tag:"Kuota hampir habis",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 🌟\n\nKuota *${c}* tinggal *3 tempat!*\n\nMau saya bantu proses *hari ini*? ✅` },
    { title:"Info Cara Bayar",tag:"Setelah deal",text:(n,c)=>`Bapak/Ibu ${n} 😊\n\nInfo pembayaran *${c}*:\n🏦 BCA: 1234567890 a.n. Alexandria School\n\nKirim bukti transfer ke sini ya 🙏` },
    { title:"Konfirmasi Terdaftar",tag:"Pembayaran lunas",text:(n,c)=>`Selamat Bapak/Ibu ${n}! 🎉\n\n✅ *${c} RESMI TERDAFTAR!*\n\nSelamat bergabung di keluarga *Alexandria School*! 🏫🌟` },
    { title:"Pengingat Bayar",tag:"Belum bayar setelah deal",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 🙏\n\nMengingatkan pembayaran *${c}* yang belum kami terima.\n\nAda kendala? Kami siap bantu 😊` },
  ]},
  { category:"Handling Keberatan",icon:"🤝",color:"bg-teal-500",scripts:[
    { title:"Keberatan Harga",tag:"Lead bilang mahal",text:(n,c)=>`Bapak/Ibu ${n}, saya paham biaya adalah pertimbangan penting 😊\n\nAda *cicilan 0% 12 bulan* lho untuk *${c}*! Mau saya simulasikan? 😊` },
    { title:"Keberatan Lokasi",tag:"Lead bilang terlalu jauh",text:(n,c)=>`Bapak/Ibu ${n} 🙏\n\nUntuk *${c}*, tersedia antar-jemput dari berbagai titik!\n\nMau saya cek titik penjemputan terdekat? 😊` },
    { title:"Bandingkan Sekolah",tag:"Masih compare sekolah lain",text:(n,c)=>`Bapak/Ibu ${n}, wajar mempertimbangkan banyak pilihan 😊\n\nBoleh jadwalkan kunjungan ke *Alexandria* untuk *${c}* langsung? 🏫` },
  ]},
  { category:"After Sales & Loyalitas",icon:"💎",color:"bg-pink-500",scripts:[
    { title:"Check-in Siswa Baru",tag:"1 bulan setelah masuk",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 😊\n\nSudah 1 bulan *${c}* di *Alexandria*. Bagaimana perkembangannya?\n\nTerima kasih sudah mempercayai kami 🌟` },
    { title:"Minta Referral",tag:"Minta rekomendasi ke teman",text:(n,c)=>`Assalamualaikum Bapak/Ibu ${n} 🌟\n\n*${c}* sudah berkembang luar biasa!\n\nJika ada kenalan yang mencari sekolah, ada *bonus spesial* untuk setiap referral! 🎁` },
  ]},
];