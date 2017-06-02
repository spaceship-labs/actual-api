module.exports = {
  isSRService: isSRService
};

function isSRService(product){
  return (product.Service === 'Y');
}

