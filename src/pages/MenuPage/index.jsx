import React, { useState } from 'react';
import {
    Box, Container, Typography,
    List, ListItem, ListItemText, ListItemButton, IconButton,
    Button, Collapse, Tabs, Tab
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Link, useNavigate } from 'react-router-dom';
import songs from '../../data/songs.json';
import SettingsDialog from '../../components/SettingsDialog';
import headerImg from '../../assets/header.png';
import './style.css';

const MenuPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [customId, setCustomId] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState("TODOS");
    const navigate = useNavigate();

    const handlePlayCustom = () => {
        if (customId.trim()) {
            navigate(`/video/${customId.trim()}`);
        }
    };

    const genres = ["TODOS", ...new Set(songs.map(s => (s.genre || "OUTROS").toUpperCase()))];

    const filteredSongs = songs.filter(song => {
        const matchesSearch = song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGenre = selectedGenre === "TODOS" || (song.genre || "OUTROS").toUpperCase() === selectedGenre;
        return matchesSearch && matchesGenre;
    });

    return (
        <div className="menu-root">
            <div className="menu-header-container">
                <img src={headerImg} alt="Cantou Bebeuokê" className="menu-logo" />
            </div>

            <Container maxWidth="md" className="menu-container">
                <Box display="flex" justifyContent="center" alignItems="center" position="relative" mb={5} mt={2}>
                    <Typography variant="h4" className="menu-title">LISTA DE MÚSICAS</Typography>
                    <IconButton
                        onClick={() => setOpenSettings(true)}
                        className="gear-button"
                    >
                        <SettingsIcon fontSize="large" />
                    </IconButton>
                </Box>

                <Box my={4} display="flex" flexDirection="column" alignItems="center" gap={3}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={1} width="100%">
                        <input
                            className="search-input-retro"
                            placeholder="Buscar música, artista ou gênero..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <IconButton
                            onClick={() => setShowCustomInput(!showCustomInput)}
                            className={`add-button-retro ${showCustomInput ? 'active' : ''}`}
                        >
                            <AddCircleOutlineIcon fontSize="large" />
                        </IconButton>
                    </Box>

                    <Collapse in={showCustomInput} style={{ width: '100%' }}>
                        <Box className="custom-input-container">
                            <input
                                className="custom-id-input-retro"
                                placeholder="Cole o código do YouTube (ex: STqknKQbZsc)"
                                value={customId}
                                onChange={(e) => setCustomId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handlePlayCustom()}
                            />
                            <Button
                                variant="contained"
                                onClick={handlePlayCustom}
                                startIcon={<PlayArrowIcon />}
                                className="play-custom-button"
                            >
                                CANTAR!
                            </Button>
                        </Box>
                    </Collapse>
                </Box>

                <Box sx={{ borderBottom: 0, mb: 2 }}>
                    <Tabs
                        value={selectedGenre}
                        onChange={(_, val) => setSelectedGenre(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        className="genre-tabs"
                        TabIndicatorProps={{ className: 'genre-indicator' }}
                    >
                        {genres.map(g => (
                            <Tab key={g} label={g} value={g} className="genre-tab" />
                        ))}
                    </Tabs>
                </Box>

                <div className="list-container-retro">
                    <List disablePadding>
                        {filteredSongs.map(song => (
                            <ListItem key={song.id} disablePadding className="song-item-retro">
                                <Link to={`/video/${song.id}`} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
                                    <ListItemButton className="song-button-retro">
                                        <ArrowRightIcon className="selection-arrow" />
                                        <Box display="flex" flexDirection="column">
                                            <Typography className="song-artist-text">
                                                {song.artist.toUpperCase()}
                                            </Typography>
                                            <Typography className="song-title-text">
                                                {song.name.toUpperCase()}
                                            </Typography>
                                        </Box>
                                    </ListItemButton>
                                </Link>
                            </ListItem>
                        ))}
                        {filteredSongs.length === 0 && (
                            <Typography align="center" className="no-songs-text">Nenhuma música encontrada.</Typography>
                        )}
                    </List>
                </div>
            </Container>

            <SettingsDialog open={openSettings} onClose={() => setOpenSettings(false)} />
        </div>
    );
};

export default MenuPage;
