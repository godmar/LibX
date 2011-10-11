
/**
 * Returns the URL to a given edition's directory.
 * @param {String} editionId  ID of the edition
 * @returns {String} URL of the edition
 */
libx.utils.getEditionPath = function (editionId) {
    if (editionId[0] >= 'a' && editionId[0] <= 'z')
        return editionId;
    return editionId.substr(0, 2) + "/" + editionId.substr(2, 2) + "/" + editionId;
};
