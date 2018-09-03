describe('InvoiceService migration', () => {
  describe('structuredItems', () => {
    it('should return the correct structured items', () => {
      const discount = 3999.8006399999995;
      const discountPercent = 20;
      const detail = {
        id: 'id.1',
        quantity: 1,
        unitPrice: 19999.0032,
      };
      const product = {
        id: 'id.1',
        quantity: 1,
        U_ClaveUnidad: 'H87',
        Service: 'N',
        ItemCode: 'ST09978',
        ItemName: 'SALA 95533 SOFA+CORNER+OTTOMAN KFC-216-33C14 GRIS CLARO',
      };

      const result = InvoiceService.structuredItems(
        discount,
        detail,
        product,
        discountPercent
      );
      console.log('result', JSON.stringify(result));
      expect(result.cantidad).to.be.equal(1);
      expect(result.Unidad).to.be.equal('Pieza');
      expect(result.valorUnitario).to.be.equal(17240.52);
      expect(result.importe).to.be.equal(17240.52);
      expect(result.descuento).to.be.equal(3448.1);
    });
  });

  describe('handleClient', () => {
    it('should return the correct structured client', () => {
      const genericClient = false;
      const client = {
        cfdiUse: 'G01',
      };
      const orderClient = {
        LicTradNum: 'PALR671017T95',
        CardName: 'ROCIO PATIÑO LASTRA',
      };
      const fiscalAddress = {
        Street: 'AV 34 SN COLONIA GONZALO GUERRERO',
        U_NumExt: '445',
        Block: 'Bonampak',
        City: 'Cancun',
        State: 'QR',
        ZipCode: '77500',
      };
      const result = InvoiceService.handleClient(
        client,
        orderClient,
        fiscalAddress,
        genericClient
      );
      console.log('result', JSON.stringify(result));
      expect(result).to.deep.equal({
        rfc: 'PALR671017T95',
        nombre: 'ROCIO PATIÑO LASTRA',
        usoCfdi: 'G01',
        DomicilioFiscal: {
          calle: 'AV 34 SN COLONIA GONZALO GUERRERO',
          noExterior: '445',
          colonia: 'Bonampak',
          localidad: 'Cancun',
          estado: 'QR',
          pais: 'México',
          cp: '77500',
        },
      });
    });
  });
  describe('formatInvoice', () => {
    it('should return the correct structured format for the invoice request', async () => {
      const order = {
        ammountPaid: 15999.21,
        total: 15999.20256,
        subtotal: 19999.0032,
        discount: 3999.8006399999995,
        paymentGroup: 1,
        CardName: 'ROCIO PATIÑO LASTRA',
        CardCode: 'C000005',
        SlpCode: -1,
        address:
          'AV. 34 LOTE 14 MZN 165 COL. GONZALO GUERRERO PLAYA DEL CARMEN',
        folio: '000347',
        createdAt: '2018-08-27T18:50:17.275Z',
        Client: {
          CardCode: 'C000005',
          CardName: 'ROCIO PATIÑO LASTRA',
          CardType: 'C',
          Phone1: null,
          Phone2: null,
          Cellular: '7774179291',
          E_Mail: 'jpablofh@gmail.com',
          LicTradNum: 'PALR671017T95',
          U_Correos: null,
          Series: 0,
          Name: null,
          cfdiUse: 'G01',
        },
      };
      const client = {
        CardCode: 'C000005',
        CardName: 'ROCIO PATIÑO LASTRA',
        CardType: 'C',
        Phone1: null,
        Phone2: null,
        Cellular: '7774179291',
        E_Mail: 'jpablofh@gmail.com',
        LicTradNum: 'PALR671017T95',
        U_Correos: null,
        Series: 0,
        Name: null,
        cfdiUse: 'G01',
      };
      const fiscalAddress = {
        Street: 'AV 34 SN COLONIA GONZALO GUERRERO',
        U_NumExt: '445',
        Block: 'Bonampak',
        City: 'Cancun',
        State: 'QR',
        ZipCode: '77500',
      };
      const payments = [
        {
          name: 'Efectivo MXN',
          type: 'cash',
          currency: 'mxn',
          exchangeRate: 18.58,
          group: 1,
          ammount: 15999.21,
          folio: '000659',
        },
      ];
      const partidas = [
        {
          cantidad: 1,
          claveUnidad: 'H87',
          Unidad: 'Pieza',
          noIdentificacion: 'ST09978',
          descripcion:
            'SALA 95533 SOFA+CORNER+OTTOMAN KFC-216-33C14 GRIS CLARO',
          valorUnitario: 17240.52,
          importe: 17240.52,
          descuento: 3448.1,
          Impuestos: [
            {
              tipo: 'traslado',
              claveImpuesto: 'IVA',
              tipoFactor: 'tasa',
              tasaOCuota: '0.16',
              baseImpuesto: 13792.42,
              importe: 2206.79,
            },
          ],
        },
      ];
      const genericClient = false;
      const result = await InvoiceService.formatInvoice(
        order,
        client,
        fiscalAddress,
        payments,
        partidas,
        genericClient
      );
      console.log('request', JSON.stringify(result));
      expect(result.CFDi.modo).to.be.equal('debug');
    });
  });

  describe('formatInvoice', () => {
    it('should return the correct structured format for the invoice request with two products', async () => {
      const order = {
        ammountPaid: 18035.39,
        total: 18035.38536,
        subtotal: 30058.975599999998,
        discount: 12023.59024,
        paymentGroup: 1,
        CardName: 'ROCIO PATIÑO LASTRA',
        CardCode: 'C000005',
        SlpCode: -1,
        address:
          'AV. 34 LOTE 14 MZN 165 COL. GONZALO GUERRERO PLAYA DEL CARMEN',
        folio: '000358',
        createdAt: '2018-08-27T18:50:17.275Z',
        Client: {
          CardCode: 'C000005',
          CardName: 'ROCIO PATIÑO LASTRA',
          CardType: 'C',
          Phone1: null,
          Phone2: null,
          Cellular: '7774179291',
          E_Mail: 'jpablofh@gmail.com',
          LicTradNum: 'PALR671017T95',
          U_Correos: null,
          Series: 0,
          Name: null,
          cfdiUse: 'G01',
        },
      };
      const client = {
        CardCode: 'C000005',
        CardName: 'ROCIO PATIÑO LASTRA',
        CardType: 'C',
        Phone1: null,
        Phone2: null,
        Cellular: '7774179291',
        E_Mail: 'jpablofh@gmail.com',
        LicTradNum: 'PALR671017T95',
        U_Correos: null,
        Series: 0,
        Name: null,
        cfdiUse: 'G01',
      };
      const fiscalAddress = {
        Street: 'AV 34 SN COLONIA GONZALO GUERRERO',
        U_NumExt: '445',
        Block: 'Bonampak',
        City: 'Cancun',
        State: 'QR',
        ZipCode: '77500',
      };
      const payments = [
        {
          name: 'Efectivo MXN',
          type: 'cash',
          currency: 'mxn',
          exchangeRate: 18.58,
          group: 1,
          ammount: 18035.39,
          folio: '000668',
        },
      ];
      const partidas = [
        {
          cantidad: 1,
          claveUnidad: 'H87',
          Unidad: 'Pieza',
          noIdentificacion: 'ST09978',
          descripcion:
            'SALA 95533 SOFA+CORNER+OTTOMAN KFC-216-33C14 GRIS CLARO',
          valorUnitario: 17240.52,
          importe: 17240.52,
          descuento: 3448.1,
          Impuestos: [
            {
              tipo: 'traslado',
              claveImpuesto: 'IVA',
              tipoFactor: 'tasa',
              tasaOCuota: '0.16',
              baseImpuesto: 13792.42,
              importe: 2206.79,
            },
          ],
        },
      ];
      const genericClient = false;
      const result = await InvoiceService.formatInvoice(
        order,
        client,
        fiscalAddress,
        payments,
        partidas,
        genericClient
      );
      console.log('request', JSON.stringify(result));
      expect(result.CFDi.modo).to.be.equal('debug');
    });
  });
});
