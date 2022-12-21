
const get_ctr = (_ => {
  let ctr = 0;
  return w => {
    if(w === 0) {
      ctr = 0;
    } else {
      ++ctr;
    }
    return ctr;
  }
})();


module.exports = {
  get_ctr,
}
