module.exports = {
  getPaymentGroups: getPaymentGroups
};

function getPaymentGroups(){
  return paymentGroups;
}

var paymentGroups = [
  {
    group:1,
    discountKey:'discountPg1',
    methods: [
      {
        label:'Tarjeta de crédito',
        name:'Tarjeta de crédito',
        type:'credit-card',
        description:'',
        cardsImages:['/cards/visa.png','/cards/mastercard.png','/cards/american.png'],
        cards:['Visa','MasterCard','American Express'],
        currency: 'mxn',
        min:0,
      },

      {
        label:'Tarjeta de débito',
        name:'Tarjeta de débito',
        type:'debit-card',
        description:'',
        cardsImages:['/cards/banamex.png','/cards/hsbc.png','/cards/santander.png'],
        moreCards: true,
        cards:['Banamex','HSBC','Inbursa','Santander'],
        currency: 'mxn',
        min:0,
      },
      /*
      {
        label:'Transferencia',
        name:'Transferencia',
        type:'transfer',
        description:'',
        cardsImages:['/cards/banamex.png','/cards/hsbc.png','/cards/santander.png'],
        moreCards: true,
        cards:[
          'Banamex',
          'Banbajio',
          'Bancomer',
          'Banco Azteca',
          'Banorte',
          'CI Banco',
          'HSBC',
          'Inbursa',
          'IXE',
          'Multiva',
          'Santander',
          'Scotiabank'
        ],
        currency: 'mxn',
        terminals:[
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
      },
      */
    ]
  },
  {
    group:2,
    discountKey:'discountPg2',
    methods: [
      {
        label:'3',
        name:'3 meses sin intereses',
        type:'3-msi',
        msi:3,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards: [
          'Afirme',
          'American Express',
          'Banamex',
          'Banbajio',
          'Banjercito',
          'Banorte',
          'Banca Mifel',
          'Bancomer',
          'Banregio',
          'Famsa',
          'HSBC',
          'Inbursa',
          'Itaucard',
          'Invex',
          'IXE',
          'Santander',
          'Liverpool Premium Card',
        ],
        moreCards: true,
        currency: 'mxn',
        min:300,
        needsVerification: true,
        web:true
      }
    ]
  },
  {
    group:3,
    discountKey:'discountPg3',
    methods: [
      {
        label:'6',
        name:'6 meses sin intereses',
        type:'6-msi',
        msi:6,
        moreCards:true,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards: [
          'Afirme',
          'American Express',
          'Banamex',
          'Banbajio',
          'Banjercito',
          'Banorte',
          'Banca Mifel',
          'Bancomer',
          'Banregio',
          'Famsa',
          'HSBC',
          'Inbursa',
          'Itaucard',
          'Invex',
          'IXE',
          'Santander',
          'Liverpool Premium Card',
        ],

        currency: 'mxn',
        min:600,
        needsVerification: true,
        web:true
      },
      {
        label:'9',
        name:'9 meses sin intereses',
        type:'9-msi',
        msi:9,
        moreCards:true,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards: [
          'Afirme',
          'American Express',
          'Banamex',
          'Banbajio',
          'Banjercito',
          'Banorte',
          'Banca Mifel',
          'Bancomer',
          'Banregio',
          'Famsa',
          'HSBC',
          'Inbursa',
          'Itaucard',
          'Invex',
          'IXE',
          'Santander',
          'Liverpool Premium Card',
        ],
        currency: 'mxn',
        min:800,
        needsVerification: true,
        web:true
      },
    ]
  },
  {
    group:4,
    discountKey:'discountPg4',
    methods: [
      {
        label:'12',
        name:'12 meses sin intereses',
        type:'12-msi',
        msi:12,
        moreCards:true,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards: [
          'Afirme',
          'American Express',
          'Banamex',
          'Banbajio',
          'Banjercito',
          'Banorte',
          'Banca Mifel',
          'Bancomer',
          'Banregio',
          'Famsa',
          'HSBC',
          'Inbursa',
          'Itaucard',
          'Invex',
          'IXE',
          'Santander',
          'Liverpool Premium Card',
        ],
        currency: 'mxn',
        min: 1200,
        needsVerification: true,
        web:true
      },
    ]
  },
  {
    group:5,
    discountKey:'discountPg5',
    methods: [
      /*
      {
        label:'18',
        name:'18 meses sin intereses',
        type:'18-msi',
        msi:18,
        cardsImages:[
          '/cards/banamex.png',
          '/cards/amexcard.png'
        ],
        cards: [
          'American Express',
          'Banamex'
        ],
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'}
        ],
        currency: 'mxn',
        needsVerification: true,
        min:2000,
        web:true
      },
      */
    ]
  },
];