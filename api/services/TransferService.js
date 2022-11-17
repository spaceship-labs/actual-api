module.exports = {
  transfers: transfers,
};

/*
function transfers(group, storeCode) {
  const marketPlace = [
    {
      currency: 'Pesos',
      bank: 'Banamex',
      sucursal: '7008',
      account: '1292351',
      clabe: '002691700812923516',
      swift: 'BNMXMXMM',
    },
  ];
  return marketPlace;
}
*/

function transfers(group, storeCode) {
  const marketPlace = [
    {
      currency: 'Pesos',
      bank: 'Bancomer',
      /* sucursal: '7008', */
      account: '0117000448',
      clabe: '012691001170004484',
      swift: 'BCMRMXMMPYM',
    },
    {
      currency: 'Pesos',
      bank: 'Bancomer',
      /* sucursal: '7008', */
      account: '0117000529',
      clabe: '012691001170005292',
      swift: 'BCMRMXMMPYM',
    },
  ];
  return marketPlace;
}

