module.exports.paymentGroups = [
  {
    group:1,
    discountKey:'discountPg1',
    methods: [
      {
        label:'Saldo a favor',
        name: 'Saldo a favor',
        type:'client-balance',
        description:'',
        currency:'mxn',
        needsVerification: false
      },
      {
        label:'Efectivo MXN',
        name:'Efectivo MXN',
        type:'cash',
        currency: 'mxn',
        needsVerification: false
      },
      {
        label:'Efectivo USD',
        name:'Efectivo USD',
        type:'cash-usd',
        currency:'usd',
        description:'Tipo de cambio $18.76 MXN',
        needsVerification: false
      },
      {
        label:'Cheque',
        name:'Cheque',
        type:'cheque',
        description:'Sujeto a verificación contable',
        currency:'mxn',
        needsVerification: false
      },
      /*
      {
        label:'Deposito en ventanilla',
        name:'Deposito en ventanilla',
        type:'deposit',
        description:'Sujeto a verificación contable',
        currency:'mxn',
        terminals:[
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
        needsVerification: false
      },
      */
      {
        label:'Transferencia MXN',
        name:'Transferencia MXN',
        type:'transfer',
        description:'Sujeto a verificación contable',
        currency: 'mxn',
        terminals:[
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
        needsVerification: true
      },
      {
        label:'Transferencia USD',
        name:'Transferencia USD',
        type:'transfer-usd',
        description:'Sujeto a verificación contable',
        currency: 'usd',
        terminals:[
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
        needsVerification: true        
      },      
      /*
      {
        label:'Monedero electrónico',
        name:'Monedero electrónico',
        type:'ewallet',
        description:'Sujeto a verificación contable',
        currency: 'mxn',
        needsVerification: false
      },
      */
      {
        label:'1 pago con',
        name:'Una sola exhibición',
        type:'single-payment-terminal',
        description:'VISA, MasterCard, American Express',
        cardsImages:['/cards/visa.png','/cards/mastercard.png','/cards/american.png'],
        cards:['Visa','MasterCard','American Express'],
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'}
        ],
        currency: 'mxn',
        needsVerification: true,
        min:0
      },
      {
        label:'Tarjeta de débito',
        name:'Tarjeta de débito',
        type:'debit-card',
        description:'VISA, MasterCard, American Express',
        cardsImages:['/cards/visa.png','/cards/mastercard.png','/cards/american.png'],
        cards:['Visa','MasterCard','American Express'],
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'}
        ],
        currency: 'mxn',
        needsVerification: true,
        min:0
      },
      {
        label:'Tarjeta de crédito',
        name:'Tarjeta de crédito',
        type:'credit-card',
        description:'VISA, MasterCard, American Express',
        cardsImages:['/cards/visa.png','/cards/mastercard.png','/cards/american.png'],
        cards:['Visa','MasterCard','American Express'],
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'}
        ],
        currency: 'mxn',
        needsVerification: true,
        min:0
      },

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
          '/cards/bancomer.png',
        ],
        cards: [
          'Afirme',
          'American Express',
          'Banbajio',
          'Bancomer',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'HSBC',
          'Inbursa',
          'Invex Banco',
          'Itaucard',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
        ],
        currency: 'mxn',
        min:300,
        needsVerification: true
      }
    ]
  },
  {
    group:3,
    discountKey:'discountPg3',
    methods: [
      {
        label:'3',
        name:'3 meses sin intereses con Banamex',
        type:'3-msi-banamex',
        msi:3,
        cardsImages:[
          '/cards/banamex.png',
        ],
        cards: [
          'Banamex'
        ],
        terminals:[
          {label:'Banamex', value:'banamex'},
        ],
        currency: 'mxn',
        min:300,
        needsVerification: true,
        mainCard: 'banamex'
      },
      {
        label:'6',
        name:'6 meses sin intereses',
        type:'6-msi',
        msi:6,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/bancomer.png',
        ],
        cards:[
          'Afirme',
          'American Express',
          'Banbajio',
          'Bancomer',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'HSBC',
          'Inbursa',
          'Invex Banco',
          'Itaucard',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
        ],
        currency: 'mxn',
        min:600,
        needsVerification: true,
      },
      {
        label:'9',
        name:'9 meses sin intereses',
        type:'9-msi',
        msi:9,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/bancomer.png',
        ],
        cards:[
          'American Express',
          'Afirme',
          'Bancomer',
          'Banbajio',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'HSBC',          
          'Inbursa',
          'Itaucard',
          'Invex Banco',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
        ],
        currency: 'mxn',
        min:900,
        needsVerification: true
      },
    ]
  },
  {
    group:4,
    discountKey:'discountPg4',
    methods: [
      {
        label:'6',
        name:'6 meses sin intereses con Banamex',
        type:'6-msi-banamex',
        msi:6,
        cardsImages:[
          '/cards/banamex.png',
        ],
        cards: [
          'Banamex'
        ],
        terminals:[
          {label:'Banamex', value:'banamex'},
        ],
        currency: 'mxn',
        min:600,
        needsVerification: true,
        mainCard: 'banamex'
      },
      {
        label:'9',
        name:'9 meses sin intereses con Banamex',
        type:'9-msi-banamex',
        msi:9,
        cardsImages:[
          '/cards/banamex.png',
        ],
        cards: [
          'Banamex'
        ],
        terminals:[
          {label:'Banamex', value:'banamex'},
        ],
        currency: 'mxn',
        min:900,
        needsVerification: true,
        mainCard: 'banamex'
      },  
      {
        label:'12',
        name:'12 meses sin intereses',
        type:'12-msi',
        msi:12,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/bancomer.png',
        ],
        cards:[
          'American Express',
          'Afirme',
          'Bancomer',
          'Banbajio',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'HSBC',
          'Inbursa',
          'Itaucard',
          'Invex Banco',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
        ],
        currency: 'mxn',
        min: 1200,
        needsVerification: true
      },                
    ]
  },
  {
    group:5,
    discountKey:'discountPg5',
    methods: [    
      {
        label:'12',
        name:'12 meses sin intereses con Banamex',
        type:'12-msi-banamex',
        msi:12,
        cardsImages:[
          '/cards/banamex.png',
        ],
        cards: [
          'Banamex'
        ],
        terminals:[
          {label:'Banamex', value:'banamex'},
        ],
        currency: 'mxn',
        min:1200,
        needsVerification: true,
        mainCard: 'banamex'
      },
      /*
      {
        label:'13',
        name:'13 meses sin intereses',
        type:'13-msi',
        msi:13,
        cardsImages:[
          '/cards/banamex.png',
        ],
        cards:[
          'Banamex'
        ],
        terminals:[
          {label:'Banamex', value:'banamex'},
        ],
        currency: 'mxn',
        min: 1300,
        needsVerification: true,
        mainCard: 'banamex'
      },
      */
      {
        label:'18',
        name:'18 meses sin intereses',
        type:'18-msi',
        msi:18,
        //cardsImages:[
        //  '/cards/amexcard.png',
        //],
        //cards: [
        //  'American Express',
        //],
        cardsImages:[
          '/cards/banamex.png',
        ],
        cards: [
          'Banamex'
        ],        
        terminals:[
          {label:'Banamex', value:'banamex'},
          //{label:'American Express', value:'american-express'},
        ],
        currency: 'mxn',
        needsVerification: true,
        min:2000
      },
    ]
  },
];