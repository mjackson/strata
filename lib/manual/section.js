module.exports = Section;

function Section(name) {
  this.name = name;
  this.chapters = [];
}

Section.prototype.addChapter = function (chapter) {
  this.chapters.push(chapter);
};
