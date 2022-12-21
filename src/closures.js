
const get_ctr = (_ => {
  let ctr = 0;
  return _ => ++ctr;
})();


module.exports = {
  get_ctr,
}
