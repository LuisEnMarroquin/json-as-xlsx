import { IContent } from '../types'
import { getJsonSheetRow } from '../index'

test('', () => {
  const track = {
    id: '4ase432i',
    name: 'Help',
    artist: 'Galantis',
    album: {
      id: '532o48sn3',
      name: 'Help',
      albumType: 'single',
      totalTracks: 1,
      releaseDate: '2014-03-11'
    },
    explicit: false,
    popularity: 21,
    durationMs: 4010
  }

  expect(getJsonSheetRow(track, [
    { label: 'ID', value: 'id' }
  ]))
    .toEqual({ ID: '4ase432i' })

  expect(getJsonSheetRow(track, [
    { label: 'Name', value: 'name' }
  ]))
    .toEqual({ Name: 'Help' })

  expect(getJsonSheetRow(track, [
    { label: 'Artist', value: 'artist' }
  ]))
    .toEqual({ Artist: 'Galantis' })

  expect(getJsonSheetRow(track, [
    { label: 'Album', value: 'album.name' }
  ]))
    .toEqual({ Album: 'Help' })

  expect(getJsonSheetRow(track, [
    { label: 'Explicit content', value: (content: IContent) => { return content.explicit ? 'Yes' : 'No' } }
  ]))
    .toEqual({ 'Explicit content': 'No' })

  expect(getJsonSheetRow(track, [
    { label: 'Popularity', value: 'popularity' }
  ]))
    .toEqual({ Popularity: 21 })

  expect(getJsonSheetRow(track, [
    { label: 'Duration', value: (content: IContent) => { return (content.durationMs as number) / 1000 + 's' } }
  ]))
    .toEqual({ Duration: '4.01s' })

  expect(getJsonSheetRow(track, [
    { label: 'URI', value: 'uri' }
  ]))
    .toEqual({ URI: '' })

  expect(getJsonSheetRow(track, [
    { label: 'Album', value: 'album' }
  ]))
    .toEqual({
      Album: {
        id: '532o48sn3',
        name: 'Help',
        albumType: 'single',
        totalTracks: 1,
        releaseDate: '2014-03-11'
      }
    })
})
