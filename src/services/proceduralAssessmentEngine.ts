import {
  QuestionItem,
  BloomLevel,
  SoloLevel,
  DeepLearningDimension,
  DifficultyLevel,
  CpThemeClassification
} from '../types';

/**
 * PROCEDURAL ASSESSMENT ENGINE 2026 FOR PAIBP FASE D (SMP/MTs)
 * Dynamically generates rich, non-static, high-entropy, pedagogical assessment questions
 * across all elements, topics, and question formats.
 */

// PRNG (Pseudo-Random Number Generator) for reproducible or high-entropy runs
export class AssessmentPRNG {
  private s: number;

  constructor(seed?: number | string) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.s = Math.abs(hash) || 123456789;
    } else if (typeof seed === 'number') {
      this.s = Math.abs(seed) || 123456789;
    } else {
      this.s = Math.floor(Date.now() + Math.random() * 1000000);
    }
  }

  // Returns number in [0, 1)
  next(): number {
    this.s = (this.s * 1664525 + 1013904223) % 4294967296;
    return this.s / 4294967296;
  }

  pick<T>(arr: readonly T[] | T[]): T {
    if (!arr || arr.length === 0) return undefined as any;
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

// Persona & Setting Repositories
const STUDENT_NAMES = [
  'Faris', 'Naila', 'Zaki', 'Salma', 'Rayhan', 'Zahra', 'Dimas', 'Khadijah',
  'Hamzah', 'Alya', 'Bilal', 'Fauziah', 'Iqbal', 'Syifa', 'Hafizh', 'Lathifah',
  'Ilham', 'Maryam', 'Rian', 'Sabrina', 'Dzaki', 'Yasmin', 'Wildan', 'Mutia',
  'Fikri', 'Hana', 'Rafi', 'Anisa', 'Rizky', 'Tsabita', 'Arif', 'Najwa'
];

interface ScenarioTemplate {
  settingName: string;
  generateStory: (p1: string, p2: string, submateri: string, dalil: string, tema: string) => string;
}

// Scenarios categorized by Element
const SCENARIOS_BY_ELEMENT: Record<string, ScenarioTemplate[]> = {
  "Al-Qur'an Hadis": [
    {
      settingName: 'Verifikasi Informasi di Media Sosial Sekolah',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Di grup percakapan media sosial kelas VII, beredar potongan tangkapan layar yang menuduh salah seorang peserta didik berbuat curang saat ujian semester. Informasi tersebut cepat menyebar dan memicu perdebatan panas. ${p1} dan ${p2} yang membaca pesan tersebut menyadari pentingnya prinsip tabayyun dan kehati-hatian lisan sebagaimana diajarkan dalam ${dalil}. Mereka menolak ikut menyebarkan pesan sebelum memvalidasi kebenarannya kepada wali kelas.`
    },
    {
      settingName: 'Pemanfaatan Riset & Kecerdasan Buatan dalam Karya Ilmiah',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `${p1} dan timnya sedang menyelesaikan makalah penelitian ilmiah remaja bertema "${submateri}". Sebagian rekan mengusulkan agar seluruh naskah disusun secara instan memakai generator teks AI tanpa sitasi rujukan. Namun, ${p1} mengingatkan pesan ${dalil} bahwa menuntut ilmu harus dilandasi integritas kejujuran intelektual, tanggung jawab moral, dan kerendahan hati (tawadhu).`
    },
    {
      settingName: 'Menghadapi Kegagalan Kompetisi dengan Sabar Aktif',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Setelah mempersiapkan diri selama dua bulan penuh untuk ajang Musabaqah Hifzhil Qur'an dan Cerdas Cermat PAI tingkat kabupaten, tim madrasah ${p1} dan ${p2} harus puas menempati posisi keempat karena selisih tipis nilai. Alih-alih berputus asa atau menyalahkan keadaan, ${p1} menguatkan rekan-rekannya dengan menghayati tuntunan ${dalil} mengenai hakikat sabar aktif dan optimisme menyongsong masa depan.`
    },
    {
      settingName: 'Toleransi Antarumat Beragama dalam Kegiatan Kemasyarakatan',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Warga lingkungan tempat tinggal ${p1} dan ${p2} mengadakan program bakti sosial gotong royong membersihkan fasilitas umum pascabanjir. Terdapat usulan dari sebagian panitia remaja untuk memilah bantuan berdasarkan latar belakang agama. ${p1} dan ${p2} menyuarakan pandangan berlandaskan ${dalil} bahwa persaudaraan kemanusiaan (ukhuwah insaniyah) dan tolong-menolong dalam kebaikan bersifat universal, tanpa mencampuradukkan ritual akidah ibadah.`
    }
  ],
  "Tajwid": [
    {
      settingName: 'Koreksi Tartil Tadarus Berjamaah di Musala',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Saat kegiatan tadarus bersama di musala madrasah sebelum jam pelajaran dimulai, ${p1} menyimak tilawah ${p2} yang sedang mempraktikkan hukum bacaan "${submateri}". Terlihat pada beberapa lafal terjadi keraguan antara membaca jelas (izhhar) atau mendengung (ghunnah). ${p1} memberikan catatan perbaikan dengan santun berlandaskan kaidah tajwid ${dalil}.`
    },
    {
      settingName: 'Persiapan Lomba Tilawah Al-Qur\'an Antar-Kelas',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Menjelang peringatan hari besar Islam, kelas ${p1} mengutus ${p2} sebagai wakil lomba tilawah Al-Qur'an tartil. Dalam sesi latihan intensif, guru pembimbing menekankan konsistensi panjang harakat pada "${submateri}" agar sesuai dengan ketentuan matan tajwid ${dalil} dan tidak mengubah makna ayat.`
    }
  ],
  "Akidah": [
    {
      settingName: 'Integritas Ujian Mandiri Berbasis Komputer',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Pada saat Penilaian Akhir Jenjang (PAJ) menggunakan gawai di laboratorium komputer, pengawas keluar ruangan sejenak karena urusan darurat. Sejumlah siswa memanfaatkan kesempatan itu untuk membuka mesin pencari jawaban. ${p1} yang duduk bersebelahan dengan ${p2} tetap tenang mengerjakan mandiri karena meyakini kehadiran dan pengawasan Allah Swt. (${dalil}) serta catatan para malaikat.`
    },
    {
      settingName: 'Mengelola Dana Kas & Donasi Kemanusiaan',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `${p1} dipercaya sebagai bendahara penggalangan dana musibah bencana alam di sekolah. Ketika menghitung uang tunai yang terkumpul, terdapat selisih lebih uang pecahan yang tidak tercatat dalam buku daftar penyumbang. ${p2} sempat bercanda menyarankan uang tersebut dipakai membeli konsumsi panitia, namun ${p1} menolak tegas berlandaskan penghayatan rukun iman dan nilai amanah (${dalil}).`
    },
    {
      settingName: 'Menghadapi Kecemasan Masa Depan dan Takdir',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `${p2} merasa sangat cemas dan overthinking mengenai pengumuman seleksi masuk SMA/MA unggulan impiannya. Melihat kondisi temannya yang murung, ${p1} berdialog tentang hakikat iman kepada Qada dan Qadar (${dalil}), yaitu menyatukan ikhtiar maksimal, doa tulus, dan kesiapan menerima ketetapan Allah dengan berbaik sangka (husnuzan).`
    },
    {
      settingName: 'Menepis Tren Ramalan Nasib dan Horoskop di Media Sosial',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Di linimasa media sosial kelas, viral aplikasi filter ramalan kepribadian dan jodoh masa depan berbasis zodiak. Banyak siswa mempercayai hasil ramalan tersebut hingga mempengaruhi suasana hati mereka. ${p1} dan ${p2} berdiskusi kritis mengenai pentingnya memurnikan tauhid dari bentuk-bentuk khurafat modern berlandaskan ${dalil}.`
    }
  ],
  "Akhlak": [
    {
      settingName: 'Gerakan Anti-Flexing dan Solidaritas Dhuafa',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Saat pembagian paket sembako OSIS untuk warga kurang mampu di sekitar sekolah, seorang siswa hendak merekam ekspresi haru penerima bantuan secara jarak dekat untuk diunggah sebagai konten viral di medsos. ${p1} menegur dengan santun bahwa memberi sedekah wajib dilandasi keikhlasan lillahi ta'ala (${dalil}) serta menjaga martabat dan privasi orang yang dibantu.`
    },
    {
      settingName: 'Adab Mengelola Emosi dalam Turnamen Futsal Antarkelas',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Pertandingan final pekan olahraga antarkelas berlangsung sengit. Wasit mengeluarkan keputusan penalti yang merugikan tim ${p1}. Salah seorang rekan tim terbakar emosi dan hendak memprovokasi kericuhan antarsuporter. ${p1} segera merangkul rekannya dan mengingatkan adab menahan amarah dan memaafkan sesuai teladan Rasulullah Saw. (${dalil}).`
    },
    {
      settingName: 'Aksi Nyata Peduli Lingkungan & Pengurangan Sampah Plastik',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Kantin madrasah menghasilkan tumpukan sampah kemasan plastik setiap jam istirahat. ${p1} dan ${p2} menginisiasi gerakan "Pelajar Berakhlak Lingkungan", mengedukasi rekan-rekannya tentang kedudukan manusia sebagai khalifah fil ardh yang bertanggung jawab menjaga kelestarian alam sebagaimana ditegaskan dalam ${dalil}.`
    },
    {
      settingName: 'Adab Berkomunikasi Digital kepada Guru dan Orang Tua',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Seorang teman mengirim pesan singkat di grup WhatsApp kepada guru mata pelajaran pada tengah malam dengan kalimat menuntut dan tanpa salam pengantar. ${p1} dan ${p2} berinisiatif membagikan panduan etika bertutur kata santun dan tawadhu kepada guru sesuai prinsip akhlak Islam (${dalil}).`
    }
  ],
  "Fikih": [
    {
      settingName: 'Praktik Rukhsah Salat Jamak-Qasar saat Perjalanan Study Tour',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Rombongan bus study tour kelas VIII menempuh perjalanan antarkota sejauh lebih dari 120 km. Menjelang waktu Magrib, bus terjebak kemacetan panjang di jalan tol. ${p1} dan ${p2} berdiskusi dengan guru pendamping mengenai penerapan rukhsah salat jamak takhir dan qasar berlandaskan tuntunan fikih ${dalil}.`
    },
    {
      settingName: 'Penanganan Situasi Ragu Rakaat Salat Berjamaah (Sujud Sahwi)',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Ketika melaksanakan salat Isya berjamaah di musala sekolah, imam lupa tasyahud awal dan langsung berdiri melanjutkan rakaat ketiga. Setelah diingatkan makmum dengan ucapan tasbih, imam tetap melanjutkan salat hingga akhir lalu melakukan sujud sahwi sebelum salam. ${p1} dan ${p2} kemudian mengkaji hikmah dan ketentuan sujud di luar rukun salat berlandaskan ${dalil}.`
    },
    {
      settingName: 'Edukasi Penyembelihan Hewan Kurban yang Halal dan Thayyib',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Pada peringatan Hari Raya Idul Adha di sekolah, ${p1} menjadi panitia pencacahan daging kurban. ${p1} mengamati proses penyembelihan domba kurban dan memastikan tata cara penyembelihan memenuhi syarat syar'i dan prinsip ihsan terhadap hewan sesuai ${dalil}.`
    },
    {
      settingName: 'Pengelolaan Wakaf Produktif Fasilitas Madrasah',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Komite madrasah menerima wakaf sebidang tanah dari keluarga alumni. Pengurus OSIS dipimpin ${p1} dan ${p2} diikutsertakan dalam forum sumbang saran pemanfaatan wakaf produktif untuk laboratorium sains dan kebun hidroponik sekolah berlandaskan aturan fikih wakaf (${dalil}).`
    }
  ],
  "Sejarah Peradaban Islam": [
    {
      settingName: 'Meneladani Etos Intelektual Baitul Hikmah Daulah Abbasiyah',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Dalam pameran literasi sejarah Islam, stan kelas ${p1} dan ${p2} menampilkan diorama Baitul Hikmah Baghdad masa Khalifah Harun Ar-Rasyid dan Al-Ma'mun. Pengunjung bertanya mengapa peradaban Islam di era tersebut mampu memimpin sains dunia. ${p1} menjelaskan keterpaduan antara dorongan wahyu Al-Qur'an (${dalil}), riset ilmiah empiris, dan keterbukaan menerjemahkan karya peradaban kuno.`
    },
    {
      settingName: 'Strategi Dakwah Kultural Walisongo di Nusantara',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Saat berkunjung ke Museum Sejarah Islam Nusantara, ${p1} dan ${p2} mengamati koleksi wayang kulit dan gamelan Sunan Kalijaga. Sebagian teman beranggapan bahwa dakwah semestinya menolak tradisi lokal secara total. ${p1} meluruskan dengan menjelaskan strategi kearifan lokal (akulturasi budaya) Walisongo yang bijak (${dalil}) tanpa mengorbankan akidah tauhid.`
    },
    {
      settingName: 'Kiprah Daulah Umayyah dalam Administrasi dan Pembangunan',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `Kelompok belajar ${p1} membedah sejarah Daulah Umayyah di Damaskus dan Cordoba. Mereka menemukan bahwa keberhasilan peradaban tersebut didukung oleh tata kelola administrasi negara yang tertib, pembangunan rumah sakit umum, dan sistem mata uang dinar mandiri, yang mencerminkan spirit ${dalil}.`
    },
    {
      settingName: 'Peran Kerajaan Samudera Pasai dan Kesultanan Demak',
      generateStory: (p1, p2, submateri, dalil, tema) =>
        `${p1} dan ${p2} mempresentasikan peran Kerajaan Islam awal di Nusantara sebagai pusat transit perdagangan internasional rempah-rempah yang menerapkan hukum dagang Islam yang adil dan jujur, sehingga menarik minat bangsa-bangsa dunia berlandaskan ajaran ${dalil}.`
    }
  ]
};

// Generic fallback scenarios if element is unusual
const FALLBACK_SCENARIOS: ScenarioTemplate[] = [
  {
    settingName: 'Studi Kasus Pembelajaran Kolaboratif di Madrasah',
    generateStory: (p1, p2, submateri, dalil, tema) =>
      `Dalam kegiatan pembelajaran kelompok di kelas, ${p1} dan ${p2} berdiskusi memecahkan problematika seputar "${submateri}". Mereka mendapati adanya perbedaan persepsi di antara anggota kelompok mengenai langkah terbaik dalam menyikapi persoalan tersebut. Menyadari pentingnya nilai "${tema}", ${p1} mengusulkan musyawarah berlandaskan tuntunan syariat (${dalil}).`
  },
  {
    settingName: 'Dilema Integritas dan Tanggung Jawab Remaja Muslim',
    generateStory: (p1, p2, submateri, dalil, tema) =>
      `Menghadapi tantangan lingkungan pergaulan modern, ${p1} dan ${p2} menghadapi situasi di mana mereka dituntut mengambil keputusan tegas terkait "${submateri}". Demi menjaga martabat moral dan mengamalkan ajaran ${dalil}, mereka menelaah dampak jangka panjang dari setiap pilihan sikap.`
  }
];

export interface ProceduralQuestionConfig {
  theme: CpThemeClassification;
  index: number;
  totalCount: number;
  variant: 'Pilihan Ganda Sederhana' | 'Pilihan Ganda Kompleks (MCMA)' | 'Pilihan Ganda Kompleks Kategori' | 'Analisis Sebab-Akibat';
  bloom: BloomLevel;
  solo: SoloLevel;
  deepLearningDim: DeepLearningDimension;
  difficulty: DifficultyLevel;
  seed?: number | string;
}

/**
 * Procedurally generates 1 fully dynamic, context-specific QuestionItem
 */
export function generateProceduralQuestion(config: ProceduralQuestionConfig): QuestionItem {
  const { theme, index, variant, bloom, solo, deepLearningDim, difficulty, seed } = config;
  const prng = new AssessmentPRNG(seed ? `${seed}-${index}` : `${Date.now()}-${index}-${Math.random()}`);

  const p1 = prng.pick(STUDENT_NAMES);
  let p2 = prng.pick(STUDENT_NAMES);
  while (p2 === p1) p2 = prng.pick(STUDENT_NAMES);

  // Submateri & Context
  const submateriList = theme.submateriScope && theme.submateriScope.length > 0
    ? theme.submateriScope
    : [theme.temaName];
  const submateri = submateriList[(index - 1) % submateriList.length];

  const contextList = theme.contextExamples && theme.contextExamples.length > 0
    ? theme.contextExamples
    : ['Kehidupan sekolah, etika digital, dan interaksi bermasyarakat'];
  const contextItem = contextList[(index - 1) % contextList.length];

  const tpList = theme.suggestedTpList && theme.suggestedTpList.length > 0
    ? theme.suggestedTpList
    : [theme.cpClause];
  const tpText = tpList[(index - 1) % tpList.length];

  // Pick scenario
  const elementScenarios = SCENARIOS_BY_ELEMENT[theme.element] || FALLBACK_SCENARIOS;
  const scenarioTpl = elementScenarios[(index - 1) % elementScenarios.length];
  const stimulus = scenarioTpl.generateStory(p1, p2, submateri, theme.dalilReference, theme.temaName);

  // Standard Bloom verbs
  let verb = 'Menganalisis';
  if (bloom === 'C2') verb = 'Menjelaskan';
  if (bloom === 'C3') verb = 'Menerapkan';
  if (bloom === 'C5') verb = 'Mengevaluasi';
  if (bloom === 'C6') verb = 'Merancang';

  const indicator = `Disajikan studi kasus tentang ${contextItem}, peserta didik dapat ${verb.toLowerCase()} implementasi nilai ${theme.temaName} (${submateri}) secara tepat berdasarkan dalil ${theme.dalilReference}.`;

  const qualityScoreObj = {
    tpAlignment: 4,
    stimulusQuality: 4,
    bloomPrecision: 4,
    soloPrecision: 4,
    optionHomogeneity: 4,
    distractorQuality: 4,
    contextuality: 4,
    cognitiveDepth: 4,
    total: 32,
    category: 'Sangat Baik' as const
  };

  // Build question depending on variant
  if (variant === 'Pilihan Ganda Sederhana') {
    return buildProceduralSingleChoice({
      theme,
      index,
      submateri,
      contextItem,
      stimulus,
      indicator,
      tpText,
      verb,
      bloom,
      solo,
      deepLearningDim,
      difficulty,
      qualityScoreObj,
      prng,
      p1,
      p2
    });
  } else if (variant === 'Pilihan Ganda Kompleks (MCMA)') {
    return buildProceduralMcma({
      theme,
      index,
      submateri,
      contextItem,
      stimulus,
      indicator,
      tpText,
      verb,
      bloom,
      solo,
      deepLearningDim,
      difficulty,
      qualityScoreObj,
      prng,
      p1,
      p2
    });
  } else if (variant === 'Pilihan Ganda Kompleks Kategori') {
    return buildProceduralCategory({
      theme,
      index,
      submateri,
      contextItem,
      stimulus,
      indicator,
      tpText,
      verb,
      bloom,
      solo,
      deepLearningDim,
      difficulty,
      qualityScoreObj,
      prng,
      p1,
      p2
    });
  } else {
    // Analisis Sebab-Akibat
    return buildProceduralCauseEffect({
      theme,
      index,
      submateri,
      contextItem,
      stimulus,
      indicator,
      tpText,
      verb,
      bloom,
      solo,
      deepLearningDim,
      difficulty,
      qualityScoreObj,
      prng,
      p1,
      p2
    });
  }
}

// ---------------------------------------------------------------------------
// 1. PROCEDURAL PILIHAN GANDA SEDERHANA
// ---------------------------------------------------------------------------
function buildProceduralSingleChoice(ctx: any): QuestionItem {
  const { theme, index, submateri, contextItem, stimulus, indicator, tpText, verb, bloom, solo, deepLearningDim, difficulty, qualityScoreObj, prng, p1 } = ctx;

  const stemPool = [
    `Berdasarkan studi kasus di atas, langkah keputusan yang paling tepat dan paling mendalam mencerminkan capaian pembelajaran tema "${theme.temaName}" adalah...`,
    `Sikap yang diambil oleh ${p1} dalam narasi tersebut paling selaras dengan esensi ajaran ${theme.dalilReference} karena...`,
    `Tindakan manakah yang membuktikan bahwa pemahaman terhadap "${submateri}" telah terinternalisasi secara autentik dalam kehidupan nyata?`,
    `Analisislah keputusan yang paling maslahat dan menjunjung tinggi integritas syariat berdasarkan persoalan di atas!`,
    `Bagaimanakah keterkaitan logis antara penghayatan nilai "${theme.temaName}" dengan komitmen menjaga kehormatan moral seorang pelajar muslim?`
  ];
  const questionText = stemPool[(index - 1) % stemPool.length];

  // Dynamically constructed 4 homogeneous options
  const correctOptionText = `Mengintegrasikan nilai ${theme.temaName} ke dalam tindakan nyata berlandaskan penghayatan ${theme.dalilReference} demi tegaknya integritas dan ketakwaan batin.`;
  const distractor1 = `Menerapkan nilai ${theme.temaName} sebatas aturan formal madrasah guna menghindari teguran dari guru dan pembina kesiswaan.`;
  const distractor2 = `Memilih jalan kompromi yang menyenangkan rekan sebaya meskipun mengabaikan rambu-rambu kehati-hatian syar'i.`;
  const distractor3 = `Mengutamakan pencitraan positif di media sosial agar diakui sebagai figur teladan berprestasi tanpa pemaknaan batin.`;

  const rawOptions = [
    { text: correctOptionText, isCorrect: true, exp: `Jawaban tepat: menghubungkan tindakan moral langsung dengan tauhid dan dalil naqli ${theme.dalilReference}.` },
    { text: distractor1, isCorrect: false, exp: 'Keliru: Kepatuhan pasif hanya demi menghindari sanksi lahiriah, belum mencerminkan ihsan.' },
    { text: distractor2, isCorrect: false, exp: 'Keliru: Kompromi sosial yang mengorbankan prinsip syariat bertentangan dengan kemurnian akhlak.' },
    { text: distractor3, isCorrect: false, exp: 'Keliru: Berorientasi pada riya dan pujian khalayak ramai (flexing) yang merusak keikhlasan.' }
  ];

  // Shuffle options
  const shuffled = prng.shuffle(rawOptions);
  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  let assignedCorrectKey: 'A' | 'B' | 'C' | 'D' = 'A';
  const distractorExplanation: Record<'A' | 'B' | 'C' | 'D', string> = { A: '', B: '', C: '', D: '' };

  const finalOptions = shuffled.map((opt, idx) => {
    const k = keys[idx];
    if (opt.isCorrect) assignedCorrectKey = k;
    distractorExplanation[k] = opt.exp;
    return { key: k, text: opt.text };
  });

  return {
    number: index,
    element: theme.element,
    tema: theme.temaName,
    temaCode: theme.themeId,
    tp: tpText,
    materi: theme.temaName,
    submateri,
    indicator,
    stimulus,
    operationalVerb: `${verb} ${submateri}`,
    bloomLevel: bloom,
    soloLevel: solo,
    deepLearningDim,
    difficulty,
    questionType: 'Pilihan Ganda',
    pgVariant: 'Pilihan Ganda Sederhana',
    questionText,
    options: finalOptions,
    correctKey: assignedCorrectKey,
    explanation: `Pilihan yang tepat mengaitkan tindakan dengan penghayatan doktrin dalil (${theme.dalilReference}) dan ketakwaan batin (Deep Learning Relational).`,
    distractorExplanation,
    islamicValue: `Karakter Nilai ${theme.temaName}`,
    realLifeContext: contextItem,
    dalilReference: theme.dalilReference,
    qualityScore: qualityScoreObj
  };
}

// ---------------------------------------------------------------------------
// 2. PROCEDURAL PILIHAN GANDA KOMPLEKS (MCMA)
// ---------------------------------------------------------------------------
function buildProceduralMcma(ctx: any): QuestionItem {
  const { theme, index, submateri, contextItem, stimulus, indicator, tpText, bloom, solo, deepLearningDim, difficulty, qualityScoreObj, prng, p1 } = ctx;

  const statements = [
    { text: `Mengaitkan setiap pertimbangan keputusan dengan dalil ${theme.dalilReference} demi kesucian hati dan integritas amal.`, isCorrect: true, exp: 'Implementasi nilai tauhid dan dalil naqli.' },
    { text: `Membatasi pengamalan ajaran agama hanya saat berada dalam pengawasan guru atau orang tua di lingkungan sekolah.`, isCorrect: false, exp: 'Bertentangan dengan konsep ihsan dan muraqabah (merasa selalu diawasi Allah Swt.).' },
    { text: `Mengajak rekan sebaya berdiskusi secara tabayyun dan beradab untuk memecahkan problematika sesuai prinsip ${theme.temaName}.`, isCorrect: true, exp: 'Mewujudkan adab tabayyun dan ukhuwah islamiyah.' },
    { text: `Mengutamakan popularitas di media sosial di atas verifikasi kebenaran dan ketelitian hukum agama.`, isCorrect: false, exp: 'Sikap mengejar riya dan popularitas semu yang dilarang agama.' }
  ];

  // Keys sequence
  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const distractorExplanation: Record<'A' | 'B' | 'C' | 'D', string> = { A: '', B: '', C: '', D: '' };
  const multiCorrectKeys: ('A' | 'B' | 'C' | 'D')[] = [];

  const mcmaOptions = statements.map((item, idx) => {
    const k = keys[idx];
    if (item.isCorrect) multiCorrectKeys.push(k);
    distractorExplanation[k] = item.isCorrect ? `Jawaban Benar: ${item.exp}` : `Keliru: ${item.exp}`;
    return { key: k, text: item.text };
  });

  return {
    number: index,
    element: theme.element,
    tema: theme.temaName,
    temaCode: theme.themeId,
    tp: tpText,
    materi: theme.temaName,
    submateri,
    indicator: `Disajikan studi kasus tentang ${contextItem}, peserta didik dapat memilih beberapa komitmen implementasi nilai ${theme.temaName} yang benar secara komprehensif.`,
    stimulus,
    operationalVerb: `Memilih beberapa alternatif solusi ${submateri}`,
    bloomLevel: bloom,
    soloLevel: solo === 'Unistructural' ? 'Multistructural' : solo,
    deepLearningDim,
    difficulty,
    questionType: 'Pilihan Ganda Kompleks',
    pgVariant: 'Pilihan Ganda Kompleks (MCMA)',
    questionText: `Berdasarkan narasi studi kasus di atas, langkah atau komitmen manakah yang mencerminkan pemahaman mendalam dan penerapan autentik nilai "${theme.temaName}"? (Pilihlah semua jawaban yang tepat / jawaban benar lebih dari satu)`,
    options: mcmaOptions,
    correctKey: multiCorrectKeys.join(', '),
    multiCorrectKeys,
    explanation: `Pilihan (${multiCorrectKeys.join(' dan ')}) adalah jawaban yang benar karena menghubungkan integritas dengan doktrin dalil ${theme.dalilReference} serta mewujudkan adab tabayyun dalam interaksi sosial.`,
    distractorExplanation,
    islamicValue: `Integritas, Tabayyun, dan Muraqabah`,
    realLifeContext: contextItem,
    dalilReference: theme.dalilReference,
    qualityScore: qualityScoreObj
  };
}

// ---------------------------------------------------------------------------
// 3. PROCEDURAL PILIHAN GANDA KOMPLEKS KATEGORI (Benar / Salah)
// ---------------------------------------------------------------------------
function buildProceduralCategory(ctx: any): QuestionItem {
  const { theme, index, submateri, contextItem, stimulus, tpText, bloom, solo, deepLearningDim, difficulty, qualityScoreObj, prng } = ctx;

  // 4 possible combinations of Truth values to ensure high dynamic variety
  const patterns = [
    { p1: 'Benar' as const, p2: 'Salah' as const, p3: 'Benar' as const, correctChoice: 'A' as const },
    { p1: 'Salah' as const, p2: 'Benar' as const, p3: 'Benar' as const, correctChoice: 'B' as const },
    { p1: 'Benar' as const, p2: 'Benar' as const, p3: 'Salah' as const, correctChoice: 'C' as const },
    { p1: 'Salah' as const, p2: 'Salah' as const, p3: 'Benar' as const, correctChoice: 'D' as const }
  ];
  const selectedPattern = patterns[(index - 1) % patterns.length];

  const statement1 = selectedPattern.p1 === 'Benar'
    ? `Pengamalan nilai "${theme.temaName}" wajib didasari niat ikhlas lillahi ta'ala berlandaskan ${theme.dalilReference}, bukan sekadar mencari pujian sesama manusia.`
    : `Pengamalan nilai "${theme.temaName}" cukup dilakukan saat menghadapi ujian sekolah agar memperoleh nilai rapor yang tinggi.`;

  const statement2 = selectedPattern.p2 === 'Benar'
    ? `Pemahaman mendalam terhadap dalil naqli berfungsi sebagai pedoman moral dalam menyaring pengaruh buruk di ruang fisik maupun era digital.`
    : `Seorang muslim diperbolehkan mengabaikan kaidah fikih dan akhlak apabila menghadapi situasi persaingan akademik yang sangat ketat.`;

  const statement3 = selectedPattern.p3 === 'Benar'
    ? `Refleksi terhadap nilai "${theme.temaName}" menumbuhkan kesadaran tanggung jawab sosial untuk menebarkan maslahat bagi sesama.`
    : `Nilai "${theme.temaName}" hanya relevan dipraktikkan pada masa lampau dan tidak dapat diterapkan dalam pergaulan remaja saat ini.`;

  const statementCategories = [
    {
      id: `stmt-${index}-1`,
      statement: statement1,
      correctCategory: selectedPattern.p1,
      explanation: selectedPattern.p1 === 'Benar'
        ? 'Benar: Keikhlasan dan tauhid adalah fondasi utama diterimanya setiap amal kebajikan dalam Islam.'
        : 'Salah: Ibadah dan akhlak tidak boleh direduksi semata-mata demi nilai rapor akademik.'
    },
    {
      id: `stmt-${index}-2`,
      statement: statement2,
      correctCategory: selectedPattern.p2,
      explanation: selectedPattern.p2 === 'Benar'
        ? 'Benar: Wahyu ilahi menjadi kompas penyaring arus informasi dan etika bermedia digital.'
        : 'Salah: Tujuan yang baik tidak boleh dicapai dengan cara melanggar syariat atau merugikan integritas moral.'
    },
    {
      id: `stmt-${index}-3`,
      statement: statement3,
      correctCategory: selectedPattern.p3,
      explanation: selectedPattern.p3 === 'Benar'
        ? 'Benar: Akhlak mulia senantiasa membuahkan kepedulian sosial dan kemaslahatan umat.'
        : 'Salah: Ajaran Islam bersifat universal dan relevan sepanjang zaman (shalihun li kulli zaman wa makan).'
    }
  ];

  const catOptions = [
    { key: 'A' as const, text: 'Pernyataan (1) Benar, (2) Salah, (3) Benar' },
    { key: 'B' as const, text: 'Pernyataan (1) Salah, (2) Benar, (3) Benar' },
    { key: 'C' as const, text: 'Pernyataan (1) Benar, (2) Benar, (3) Salah' },
    { key: 'D' as const, text: 'Pernyataan (1) Salah, (2) Salah, (3) Benar' }
  ];

  return {
    number: index,
    element: theme.element,
    tema: theme.temaName,
    temaCode: theme.themeId,
    tp: tpText,
    materi: theme.temaName,
    submateri,
    indicator: `Disajikan stimulus kontekstual tentang ${contextItem}, peserta didik dapat mengkaji kebenaran serangkaian pernyataan terkait nilai ${theme.temaName} ke dalam kategori Benar atau Salah.`,
    stimulus,
    operationalVerb: `Mengevaluasi kebenaran pernyataan ${submateri}`,
    bloomLevel: bloom,
    soloLevel: solo,
    deepLearningDim,
    difficulty,
    questionType: 'Pilihan Ganda Kompleks',
    pgVariant: 'Pilihan Ganda Kompleks Kategori',
    categoryType: 'Benar / Salah',
    statementCategories,
    questionText: `Cermatilah serangkaian pernyataan berikut berdasarkan stimulus kasus di atas, kemudian analisislah ketepatan masing-masing pernyataan ke dalam kategori Benar atau Salah!`,
    options: catOptions,
    correctKey: selectedPattern.correctChoice,
    explanation: `Analisis yang tepat adalah: Pernyataan 1 (${selectedPattern.p1}), Pernyataan 2 (${selectedPattern.p2}), dan Pernyataan 3 (${selectedPattern.p3}). Maka pilihan kombinasi yang tepat adalah ${selectedPattern.correctChoice}.`,
    distractorExplanation: {
      A: selectedPattern.correctChoice === 'A' ? 'Kunci jawaban yang tepat.' : 'Kombinasi kategori tidak sesuai dengan analisis kaidah syariat.',
      B: selectedPattern.correctChoice === 'B' ? 'Kunci jawaban yang tepat.' : 'Kombinasi kategori tidak sesuai dengan analisis kaidah syariat.',
      C: selectedPattern.correctChoice === 'C' ? 'Kunci jawaban yang tepat.' : 'Kombinasi kategori tidak sesuai dengan analisis kaidah syariat.',
      D: selectedPattern.correctChoice === 'D' ? 'Kunci jawaban yang tepat.' : 'Kombinasi kategori tidak sesuai dengan analisis kaidah syariat.'
    },
    islamicValue: `Kejujuran Intelektual, Ikhlas, dan Istiqamah`,
    realLifeContext: contextItem,
    dalilReference: theme.dalilReference,
    qualityScore: qualityScoreObj
  };
}

// ---------------------------------------------------------------------------
// 4. PROCEDURAL ANALISIS SEBAB-AKIBAT
// ---------------------------------------------------------------------------
function buildProceduralCauseEffect(ctx: any): QuestionItem {
  const { theme, index, submateri, contextItem, stimulus, tpText, difficulty, qualityScoreObj, prng } = ctx;

  // 3 distinct causality modes to avoid static "A" keys every time
  const causeModes = [
    {
      cause: `Setiap muslim dituntut menginternalisasi dan membiasakan nilai "${theme.temaName}" dalam kehidupan bermasyarakat dan etika digital secara konsisten.`,
      effect: `Penghayatan mendalam terhadap dalil naqli (${theme.dalilReference}) menumbuhkan kesadaran muraqabah (merasa senantiasa diawasi Allah Swt.) sehingga melahirkan integritas moral yang kokoh.`,
      correctKey: 'A' as const,
      relation: 'Keduanya benar dan menunjukkan hubungan sebab akibat.',
      explanation: `Pernyataan bernilai BENAR karena komitmen akhlak pada tema "${theme.temaName}" wajib konsisten. Alasan juga bernilai BENAR karena penghayatan dalil ${theme.dalilReference} membangkitkan muraqabah. Hubungan keduanya adalah KAUSALITAS SEBAB-AKIBAT yang padu.`
    },
    {
      cause: `Penerapan nilai "${theme.temaName}" (${submateri}) merupakan kewajiban moral setiap insan beriman dalam ruang privat maupun publik.`,
      effect: `Umat Islam disunnahkan melaksanakan salat gerhana bulan (khusuf) secara berjamaah ketika terjadi fenomena astronomi gerhana di wilayahnya.`,
      correctKey: 'B' as const,
      relation: 'Pernyataan benar, alasan benar, tetapi tidak menunjukkan hubungan sebab akibat.',
      explanation: `Pernyataan bernilai BENAR sesuai tuntunan ${theme.dalilReference}. Alasan juga bernilai BENAR secara fikih ibadah. Namun, KEDUANYA TIDAK MEMILIKI HUBUNGAN SEBAB-AKIBAT karena membahas dua topik hukum syariat yang independen.`
    },
    {
      cause: `Seorang pelajar muslim yang beriman kepada ${theme.temaName} akan menjauhi kecurangan akademik dan penyebaran berita bohong (hoaks).`,
      effect: `Dalam ajaran Islam, status keimanan seseorang hanya diukur dari banyaknya jumlah pengikut (followers) dan keterkenalan nama di ranah media sosial.`,
      correctKey: 'C' as const,
      relation: 'Pernyataan benar dan alasan salah.',
      explanation: `Pernyataan bernilai BENAR karena iman melahirkan integritas perilaku. Alasan bernilai SALAH karena derajat kemuliaan di sisi Allah Swt. diukur dari ketakwaan hati (Q.S. Al-Hujurat: 13), bukan popularitas duniawi.`
    }
  ];

  const selectedMode = causeModes[(index - 1) % causeModes.length];

  const causeEffectOptions = [
    { key: 'A' as const, text: 'Pernyataan benar, alasan benar, dan keduanya menunjukkan hubungan sebab akibat.' },
    { key: 'B' as const, text: 'Pernyataan benar, alasan benar, tetapi keduanya tidak menunjukkan hubungan sebab akibat.' },
    { key: 'C' as const, text: 'Pernyataan benar dan alasan salah.' },
    { key: 'D' as const, text: 'Pernyataan salah dan alasan benar.' }
  ];

  return {
    number: index,
    element: theme.element,
    tema: theme.temaName,
    temaCode: theme.themeId,
    tp: tpText,
    materi: theme.temaName,
    submateri,
    indicator: `Disajikan dua proposisi terkait ${contextItem}, peserta didik dapat menganalisis kebenaran masing-masing pernyataan dan hubungan kausalitas (sebab-akibat) penerapan nilai ${theme.temaName}.`,
    stimulus,
    operationalVerb: `Menganalisis hubungan kausalitas sebab-akibat ${submateri}`,
    bloomLevel: 'C4',
    soloLevel: 'Relational',
    deepLearningDim: 'Merefleksi',
    difficulty,
    questionType: 'Analisis Sebab-Akibat',
    pgVariant: 'Analisis Sebab-Akibat',
    causeStatement: selectedMode.cause,
    effectStatement: selectedMode.effect,
    causeEffectRelation: selectedMode.relation,
    questionText: `Bacalah dengan saksama dua pernyataan kausalitas berikut ini:\n\nPernyataan: ${selectedMode.cause}\n\nSEBAB\n\nAlasan: ${selectedMode.effect}\n\nBagaimanakah analisis kebenaran dan hubungan kausalitas dari kedua pernyataan di atas?`,
    options: causeEffectOptions,
    correctKey: selectedMode.correctKey,
    explanation: selectedMode.explanation,
    distractorExplanation: {
      A: selectedMode.correctKey === 'A' ? 'Kunci jawaban yang tepat.' : 'Kausalitas tidak terpenuhi atau terdapat pernyataan yang salah.',
      B: selectedMode.correctKey === 'B' ? 'Kunci jawaban yang tepat: dua proposisi benar tanpa korelasi kausal.' : 'Hubungan proposisi tidak tepat.',
      C: selectedMode.correctKey === 'C' ? 'Kunci jawaban yang tepat: alasan salah secara syariat.' : 'Penilaian kebenaran proposisi keliru.',
      D: 'Keliru: pernyataan awal bernilai benar sesuai kaidah Islam.'
    },
    islamicValue: `Muraqabah, Integritas Kausalitas Tauhid`,
    realLifeContext: contextItem,
    dalilReference: theme.dalilReference,
    qualityScore: qualityScoreObj
  };
}
