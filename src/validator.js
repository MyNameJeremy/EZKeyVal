class Validator {
  schemas = {};

  addSchema(key, schema, allow_overwrite = false) {
    this.schemas[key] = allow_overwrite ? schema : this.schemas[key] || schema;
  }

  /**
   * @param {Object<string, any>} obj
   * @param {string} key
   * @returns {Object<string, any> | false}
   */
  validate(obj, key) {
    return this.schemas[key] ? this.validate_layer(obj, this.schemas[key]) : obj;
  }

  /**
   * @param {Object<string, any>} obj
   * @param {Object<string, string | Object>} schema
   * @returns {Object<string, any> | false}
   */
  validate_layer(obj, schema, strict) {
    let obj_layer = {};
    for (const key in schema) {
      if (!obj.hasOwnProperty(key))
        if (strict) return false;
        else continue;
      if (typeof schema[key] === 'object')
        if ((obj_layer[key] = this.validate_layer(obj[key], schema[key], strict)) === false) return false;
        else continue;
      if (schema[key] === 'any' || typeof obj[key] === schema[key]) obj_layer[key] = obj[key];
      else if (typeof obj[key] !== 'object') return false;
      if (schema[key] === 'array' && Array.isArray(obj[key])) obj_layer[key] = obj[key];
      else if (obj[key] === null) obj_layer[key] = obj[key];
      else return false;
    }
    return obj_layer;
  }
}

module.exports = { Validator };
